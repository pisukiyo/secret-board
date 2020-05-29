'use strict';
const postsハンドラ = require('./posts-ハンドラ');
const 多用途 = require('./ハンドラ-多用途')

function ルート(req, res) {
  switch (req.url) {
    case '/posts':
      postsハンドラ.ハンドル(req, res);
      break;
    case '/posts?delete=1':
      postsハンドラ.削除ハンドル(req, res);
      break;
    case '/logout':
      多用途.ハンドルログアウト(req, res);
      break;
    case '/favicon.ico':
      多用途.ハンドルファビコン(req, res);
      break;
    default:
      多用途.ハンドルページなし(req, res);
  }
}
module.exports = {
  ルート
};