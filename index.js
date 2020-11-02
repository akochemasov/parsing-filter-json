const fs = require('fs');
const https = require('https');

let fileRead = 'files/in/translation.json';
const fileWriteLang = 'files/out/translation-lang.json';
const fileWriteKeys = 'files/out/translation-keys.json';
const fileWriteLangAndKeys = 'files/out/translation-lang-keys.json';
let fileWrite = '';

const defaultKeys = ['key_web', 'translation'];
const defaultLang = ['ru', 'en'];

// разные виды фильтрации
const filter = {
  lang:  true,
  keys: true
}

const removeOtherLanguageNot = (data, langs) => {
  let dataLang = {};
  for (var key in data) {
    if (langs.includes(key)) {
      dataLang[key] = data[key]
    }
  }
  return dataLang;
}

const removeKeys = (data, keys) => {
  for (var key in data) {
    data[key].forEach((item) => {
      for (keyItem in item) {
        if (!keys.includes(keyItem)) {
          delete item[keyItem]
        } 
      }
    })
  }
  return data;
}

parsingFile = (data) => {
  console.time('Скорость выполнения кода');
  const dataRead= JSON.parse(data);  

  let dataFilter = {};
  for (var key in dataRead) {
    if (key === 'response') {
      dataFilter[key] = dataRead[key];
    }
    if (key === 'strings') {
      if (filter.lang && filter.keys) {
        dataFilter[key] = removeOtherLanguageNot(dataRead[key], defaultLang);
        dataFilter[key] = removeKeys(dataFilter[key], defaultKeys);
        fileWrite = fileWriteLangAndKeys;
      } else if (filter.lang) {
          //убрать языки кроме перечисленных
          dataFilter[key] = removeOtherLanguageNot(dataRead[key], defaultLang)
          fileWrite = fileWriteLang;
      } else if (filter.keys) {
          //убрать лишние поля
          dataFilter[key] = removeKeys(dataRead[key], defaultKeys);
          fileWrite = fileWriteKeys;
      }
    }
  }
 
  console.timeEnd('Скорость выполнения кода');
  return [dataFilter, fileWrite]
}

outputFile = (data, file) => {
  if (file) {
    const dataWrite = JSON.stringify(data);
    fs.writeFileSync(file, dataWrite);
  } else {
    console.log('Не выбран файл для записи. Или не выбрали фильтрацию')
  }
}

readFile = (fileRead) => {
  fs.readFile(fileRead, 'utf8', (err, data) => {
    if (err) {
      console.log('Ошибка чтения файла или файл не найден', err)
      throw err;
    }
  
    const [dataWrite, fileWrite] = parsingFile(data);
    outputFile(dataWrite, fileWrite)
  });
}

getFile = (fileRead) => {
  https.get(fileRead, (resp) => {
    let data = '';

    resp.on('data', (chunk) => {
      data += chunk;
    });

    resp.on('end', () => {
      const [dataWrite, fileWrite] = parsingFile(data);
      outputFile(dataWrite, fileWrite)
    });
  }).on('error', (err) => {
    console.error(`Error: ${err.message}`);
  });
}


// Основной код
if (process.env.FILE_PATH) {
  fileRead = process.env.FILE_PATH;
} else {
  console.log('Путь до файла не передан. Используем по умолчанию ' + fileRead);
}

// Eсли в пути файла есть http(s):, то
if (fileRead.includes('htt')) {
  getFile(fileRead)
} else {
  readFile(fileRead)
}