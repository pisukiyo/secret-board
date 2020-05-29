'use strict';
const fs = require('fs');

function ハンドルファビコン(req, res) {
  res.writeHead(200, {
    'Content-Type': 'image/vnd.microsoft.icon'
  });
  const favicon = fs.readFileSync('./favicon.ico');
  res.end(favicon);
}


function ハンドラ転送(req, res) {
  res.writeHead(303, {
    'Location': '/posts'
  });
  res.end();
}

function ハンドラ非対応メソッド(req, res) {
  res.writeHead(400, {
    'Content-Type': 'text/plain; charset=utf-8'
  });
  res.end('対応していないリクエストです');
}

function ハンドルログアウト(req, res) {
  エラーhtml(res, 401, 'ログアウトしました');
}

function ハンドルページなし(req, res) {
  エラーhtml(res, 404, 'ページが見つかりません');
}
function エラーhtml(res, エラー番号, エラーメッセージ) {
  res.writeHead(エラー番号, {
    'Content-Type': 'text/html; charset=utf-8'
  });
  res.end(`<h1>${エラーメッセージ}</h1>
  <a href="/posts">ログイン</a>`);

}

module.exports = {
  ハンドルファビコン,
  ハンドラ転送,
  ハンドラ非対応メソッド,
  ハンドルログアウト,
  ハンドルページなし,

};