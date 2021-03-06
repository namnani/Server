 const express = require('express');
 const router = express.Router();
const async = require('async');
const bodyParser = require('body-parser');
const http = require('http');

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: false }));


const jwt = require('../../module/jwt.js');
const db = require('../../module/pool.js');

const request = require('request-promise');

router.post('/', async(req, res, next) => {
  console.log("===insert_userinfo.js ::: router('/')===");
  
  // 카카오톡 access token
  let accessToken = req.body.accessToken;
  if(!accessToken){
    res.status(401).send({
        message : "Access Denied"
    });

    return;
  }
  console.log(accessToken);
  // // push 알람 클라이언트 토큰
  // let fcmToken = req.body.fcmToken;
  let option = {
    method : 'GET',
    uri: 'https://kapi.kakao.com/v2/user/me',
    json : true,
    headers : {
      'Authorization': "Bearer " +  accessToken
    }
  }
  try {
    let kakaoResult = await request(option);
    console.log(kakaoResult);
    let result = {};
    result.nickname = kakaoResult.properties.nickname;
    result.thumbnail_image = kakaoResult.properties.thumbnail_image;

    var nickname = kakaoResult.properties.nickname;
    var img_url = kakaoResult.properties.thumbnail_image;

    //console.log(kakaoResult.kakao_account.has_email + " : " + kakaoResult.kakao_account.email);
    var id = kakaoResult.id;
    var token;

    var chkToken;
    if(req.headers.token!= undefined){
      chkToken = jwt.verify(req.headers.token);
    }
    console.log(chkToken);

    let checkidQuery =
    `
    SELECT * FROM user
    WHERE usr_id = ?
    `;

    let insertQuery =
    `
    INSERT INTO user (usr_id, usr_name, usr_img)
    VALUES (?, ?, ?);
    `;
    /*let updateToken =
    `
    UPDATE user SET usr_fcmToken = ? WHERE usr_id = ?;
    `;*/

    if(chkToken != undefined){ // 토큰이 이미 있는 경우 (로그인 되어있는 경우)
      console.log("토큰이 있습니다");
      if(chkToken.id == id){
        console.log("성공적으로 로그인 되었습니다");
        token = jwt.sign(id);
        res.status(201).send({
          data : {
            id : id,
            flag : 0,
            token : token
          },
          message : "success"
        });
      } else { // 토큰이 만료된 경우 재발급
        console.log("기간이 만료되었습니다. 재발급 합니다");
        token = jwt.sign(id);
        res.status(201).send({
          data : {
            id : id,
            flag : 0,
            token : token
          },
          message : "success"
        })
      }
    } else{ // 토큰이 없는 경우*/
      let checkid = await db.queryParam_Arr(checkidQuery,[id]);

      if(checkid.length != 0){ // 기기를 변경했을 경우
        // fcm token update
        //let updatefcmToken = await db.queryParamCnt_Arr(updateToken, [fcmToken, id]);

        console.log("다른기기에서 접속했습니다");
        token = jwt.sign(id);
        var chkToken = jwt.verify(token);
        /*res.status(201).send({
          data : {
            id : id,
            flag : 0,
            token : token
          },
          message : "success"
        });*/
        if(chkToken.id==checkid[0].usr_id){
          console.log("성공적으로 로그인 되었습니다");
          token = jwt.sign(id);
          res.status(201).send({
            data : {
              id : id,
              flag : 0,
              token : token
            },
            message : "success"
          });
        } else { // 토큰이 만료된 경우 재발급
          console.log("기간이 만료되었습니다. 재발급 합니다");
          token = jwt.sign(id);
          console.log(token)
          res.status(201).send({
            data : {
              id : id,
              flag : 0,
              token : token
            },
            message : "success"
          });
        }
       } else{ // 다른 기기이고 회원이 아닐때
        console.log("비회원입니다.")        
        token = jwt.sign(id);
        console.log(token);
        res.status(201).send({
          data : {
            id : id,
            nickname : nickname,
            flag : 1,
            token : token
          },
          message : "success"
        })
      }
    }
  }
  catch(err) {
    console.log("kakao Error => " + err);
    next(err);
  }
  finally {
    console.log('finally');
  }

});

 module.exports = router;


// test kakaotalk accessToken
// 2boHtx7R8VbqhnWNE_pcIUvFX4RLNsAKD8eQSQo8BVUAAAFkaVQVfQH2ACd2WBP9T2HiuqNQxueKIWuxsSk-idgEyhSQo8BZUAAAFkaO2ToA
