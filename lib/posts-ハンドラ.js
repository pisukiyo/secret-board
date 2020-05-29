'use strict';
const crypto = require('crypto');
const pug = require('pug');
const Cookies = require('cookies');
const 多用途 = require('./ハンドラ-多用途')
const Post = require('./post');
const moment = require('moment-timezone');

const トラッキングIDキー = 'tracking_id';

const oneTimeTokenMap = new Map(); // キーをユーザー名、値をトークンとする連想配列

function ハンドル(req, res) {
  const クッキー = new Cookies(req, res);
  const トラッキングID = トラッキングクッキー追加(クッキー, req.user);

  switch (req.method) {
    case 'GET':
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8'
      });

      Post.findAll({
        order: [['id', 'DESC']]
      }).then((DB情報) => {

        DB情報.forEach((投稿情報) => {
          投稿情報.content = 投稿情報.content.replace(/\+/g, ' ');
          投稿情報.formattedCreatedAt = moment(投稿情報.createdAt).tz('Asia/Tokyo').format('YYYY年MM月DD日 HH時mm分ss秒');
        });
        const oneTimeToken = crypto.randomBytes(8).toString('hex');
        oneTimeTokenMap.set(req.user, oneTimeToken);

        res.end(pug.renderFile('./views/posts.pug', {
          DB情報: DB情報,
          user: req.user,
          oneTimeToken: oneTimeToken,
        }));
      });

      console.info(
        `閲覧されました: user: ${req.user}, ` +
        `トラッキングID: ${トラッキングID},` +
        `remoteAddress: ${req.connection.remoteAddress}, ` +
        `user-agent: ${req.headers['user-agent']}, `
      );

      break;
    case 'POST':
      let body = '';
      req.on('data', (chunk) => {
        body = body + chunk;
      }).on('end', () => {

        const decoded = decodeURIComponent(body);
        const dataArray = decoded.split('&');
        const content = dataArray[0] ? dataArray[0].split('content=')[1] : '';
        const requestedOneTimeToken = dataArray[1] ? dataArray[1].split('oneTimeToken=')[1] : '';
        if (oneTimeTokenMap.get(req.user) === requestedOneTimeToken) {
          console.info('投稿されました: ' + content);

          Post.create({
            content: content,
            trackingCookie: トラッキングID,
            postedBy: req.user
          }).then(() => {
            oneTimeTokenMap.delete(req.user);
            多用途.ハンドラ転送(req, res);
          });
        } else {
          多用途.ハンドラ非対応メソッド(req, res);
        }
      });
      break;
    default:
      多用途.ハンドラ非対応メソッド(req, res);
      break;
  }
}

/**
 * Cookieに含まれているトラッキングIDに異常がなければその値を返し、
 * 存在しない場合や異常なものである場合には、再度作成しCookieに付与してその値を返す
 * @param {Cookies} cookies
 * @param {String} userName
 * @return {String} トラッキングID
 */
function トラッキングクッキー追加(cookies, userName) {
  const リクエストトラッキングＩＤ = cookies.get(トラッキングIDキー);
  if (有効なトラッキングＩＤか(リクエストトラッキングＩＤ, userName)) {
    return リクエストトラッキングＩＤ;
  } else {
    const originalId = parseInt(crypto.randomBytes(8).toString('hex'), 16);
    const tomorrow = new Date(Date.now() + (1000 * 60 * 60 * 24));
    const トラッキングID = originalId + '_' + createValidHash(originalId, userName);
    cookies.set(トラッキングIDキー, トラッキングID, { expires: tomorrow });
    return トラッキングID;
  }
}

function 有効なトラッキングＩＤか(トラッキングID, userName) {
  if (!トラッキングID) {
    return false;
  }
  const splitted = トラッキングID.split('_');
  const originalId = splitted[0];
  const requestedHash = splitted[1];
  return createValidHash(originalId, userName) === requestedHash;
}
const secretKey =
  '5a69bb55532235125986a0df24aca759f69bae045c7a66d6e2bc4652e3efb43da4' +
  'd1256ca5ac705b9cf0eb2c6abb4adb78cba82f20596985c5216647ec218e84905a' +
  '9f668a6d3090653b3be84d46a7a4578194764d8306541c0411cb23fbdbd611b5e0' +
  'cd8fca86980a91d68dc05a3ac5fb52f16b33a6f3260c5a5eb88ffaee07774fe2c0' +
  '825c42fbba7c909e937a9f947d90ded280bb18f5b43659d6fa0521dbc72ecc9b4b' +
  'a7d958360c810dbd94bbfcfd80d0966e90906df302a870cdbffe655145cc4155a2' +
  '0d0d019b67899a912e0892630c0386829aa2c1f1237bf4f63d73711117410c2fc5' +
  '0c1472e87ecd6844d0805cd97c0ea8bbfbda507293beebc5d9';
function createValidHash(originalId, userName) {
  const sha1sum = crypto.createHash('sha1');
  sha1sum.update(originalId + userName + secretKey);
  return sha1sum.digest('hex');
}


function 削除ハンドル(req, res) {
  switch (req.method) {
    case 'POST':
      let body = '';
      req.on('data', (chunk) => {
        body = body + chunk;
      }).on('end', () => {
        const 解読 = decodeURIComponent(body);

        const データ配列 = 解読.split('&');
        console.info('データ配列:' + データ配列);
        const id = データ配列[0] ? データ配列[0].split('id=')[1] : '';
        const requestedOneTimeToken = データ配列[1] ? データ配列[1].split('oneTimeToken=')[1] : '';
        if (oneTimeTokenMap.get(req.user) === requestedOneTimeToken) {
          Post.findById(id).then((投稿) => {
            if (req.user === 投稿.postedBy || req.user === 'admin') {
              投稿.destroy().then(() => {
                oneTimeTokenMap.delete(req.user);
                多用途.ハンドラ転送(req, res);
              });
            }
          });
        } else {
          多用途.ハンドラ非対応メソッド(req, res);
        }
      });

      console.info(
        `削除されました: user: ${req.user}, ` +
        `remoteAddress: ${req.connection.remoteAddress}, ` +
        `userAgent: ${req.headers['user-agent']} `
      );
      break;
    default:
      多用途.ハンドラ非対応メソッド(req, res);
      break;
  }
}
module.exports = {
  ハンドル,
  削除ハンドル,
};