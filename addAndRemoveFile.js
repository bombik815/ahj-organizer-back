const store = require('./storage');
const fs = require('fs');
const path = require('path');

function clearTrashFiles(store, list) {
  console.log('clear');
  if (store.length > 0) {
    for (let i = 1; i < list.length; i++) {
      const findId = store.find((elem) => elem.idName === list[i]);
      const path = `${__dirname}/uploads/${list[i]}`;
      if (findId) {
        fs.unlinkSync(path);
      }
    }
  } else {
    for (let i = 1; i < list.length; i++) {
      const path = `${__dirname}/uploads/${list[i]}`;
      console.log(list[i]);
      fs.unlinkSync(path);
    }
  }
}

function fileToStore(file, id) {
  let typeFile = null;

  if (file.type.includes('image')) {
    typeFile = 'image';
  }
  if (file.type.includes('text')) {
    typeFile = 'text';
  }
  if (file.type.includes('audio')) {
    typeFile = 'audio';
  }
  if (file.type.includes('video')) {
    typeFile = 'video';
  }
  return {
    type: typeFile,
    name: file.name,
    size: file.size,
    idName: id,
    date: new Date().getTime(),
  };
}

function deleteFileInStore(id) {
  let index = null;

  store.forEach((elem, i) => {
    if (elem.idName === id) {
      index = i;
    }
  })
  store.splice(index, 1);
}

module.exports = { fileToStore, deleteFileInStore, clearTrashFiles };
