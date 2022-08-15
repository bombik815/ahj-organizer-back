const Koa = require('koa');
const koaBody = require('koa-body');
const koaStatic = require('koa-static');
const cors = require('koa2-cors');
const Router = require('koa-router');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const router = new Router();
const app = new Koa();
const { fileToStore, deleteFileInStore, clearTrashFiles } = require('./addAndRemoveFile');
const store = require('./storage');
const uploads = path.join(__dirname, '/uploads');
let pinId = null;

app.use(koaStatic(uploads));

let list = fs.readdirSync(uploads);

clearTrashFiles(store, list);

app.use(koaBody({
    text: true,
    urlencoded: true,
    multipart: true,
    json: true,
}));


app.use(cors({
    origin: '*',
    credentials: true,
    'Access-Control-Allow-Origin': true,
    allowMethods: ['GET', 'POST', 'DELETE']
}));

router.get('/store', async (ctx) => {
  store.sort((a, b) => {
    if (a.date > b.date) {
      return 1;
    }
    if (a.date < b.date) {
      return -1;
    }
    return 0;
  });

  const reversed = store.reverse();
  const length = ctx.request.querystring;
  const storeLength = store.length;

  if (+length === storeLength) {
    return ctx.status = 204;
  }

  if (reversed.length > 13) {
    const index = (reversed.length - (+length + 13));
    const respStore = [];

    if (index >= 0) {
      for (let i = +length; i < (+length + 13); i++) {
        respStore.push(reversed[i]);
      }
      ctx.response.body = JSON.stringify(respStore);
    } else {
      for (let i = +length; i < reversed.length; i++) {
        respStore.push(reversed[i]);
      }
      ctx.response.body = JSON.stringify(respStore);
    }

  } else {
    ctx.response.body = JSON.stringify(reversed);
  }

  ctx.status = 200;
});

router.get('/download', async (ctx) => {
  const name = ctx.request.querystring;
  list = fs.readdirSync(uploads);
  list.forEach((elem) => {

    if (elem === name) {
      const path = `${__dirname}/uploads/${name}`;

        try {
          if (fs.existsSync(path)) {
            const readStream = fs.createReadStream(path);
            ctx.attachment(name);
            ctx.response.body = readStream;
          } else {
            ctx.throw(400, "Requested file not found on server");
          }
        } catch(error) {
          ctx.throw(500, error);
        }  
    }
  });
  ctx.status = 200;
});

router.post('/pin', async (ctx) => {
  const id = ctx.request.body;
  pinId = id;
  ctx.status = 200;
})

router.get('/pin', async (ctx) => {
  ctx.response.body = pinId;
  ctx.status = 200;
})

router.post('/messages', async (ctx) => {
  const message = JSON.parse(ctx.request.body);
  message.idName = uuidv4();
  store.push(message);
  ctx.response.body = message.idName;
  ctx.status = 200;
})

router.post('/uploads', async (ctx) => {
  const { file } = ctx.request.files;

  let name = null;
  const link = await new Promise((resolve, reject) => {
    const oldPath = file.path;
    const filename = uuidv4();
    name = filename;
    const newPath = path.join(uploads, filename);
    const callback = (error) => reject(error);

    const readStream = fs.createReadStream(oldPath);
    const writeStream = fs.createWriteStream(newPath);

    readStream.on('error', callback);
    writeStream.on('error', callback);

    readStream.on('close', () => {
      fs.unlink(oldPath, callback);
      resolve(filename);
    });

    readStream.pipe(writeStream);
  });

  list = fs.readdirSync(uploads);
  store.push(fileToStore(file, name));
  ctx.response.body = name;
  ctx.response.status = 200;
});

router.get('/removePin', async ctx => {
  try {
    const id = ctx.request.querystring;
    if (id === pinId) {
      pinId = null;
      ctx.response.body = 'delete pinned';
    }
    ctx.response.status = 200;
  } catch (error) {
    ctx.throw(error);
  }
})

router.get('/delete', async ctx => {
  const name = ctx.request.querystring;
  const path = `${__dirname}/uploads/${name}`;
  try {
    deleteFileInStore(name);
    if (fs.existsSync(path)) {
      fs.unlinkSync(path);
      list = fs.readdirSync(uploads);
    }
    ctx.response.status = 200;
  } catch (error) {
    ctx.throw(error);
  }
});

app.use(router.routes()).use(router.allowedMethods());

const port = process.env.PORT || 3333;
app.listen(port, () => console.log('Server started'));