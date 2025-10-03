const express = require("express"); //서버 실행 모듈
const cors = require("cors"); // 프론트/백 연결 모듈???
const mongoose = require("mongoose"); //몽고디비 연결모듈
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const path = require("path");
const mqtt = require("mqtt"); //H/W로 요청보내는 MQTT 브로커 모듈
const Gpio = require("onoff").Gpio; //gpio 읽어오는 모듈
const passport = require("passport");
const KakaoStrategy = require("passport-kakao").Strategy;
const crypto = require("crypto");
const axios = require("axios");
const { time } = require("console");
require("dotenv").config(); //중요 정보 env로 암호

const app = express();
// ✅ CORS 설정
const allowedOrigins = [
  "http://localhost:3000", // 개발용
  "http://localhost:5000", // 개발용
  "https://port-0-umbrella-rental-system-m7zym17l4e447569.sel4.cloudtype.app", // 배포용
];

app.use(
  cors({
    origin: "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  })
);
app.use(express.json());
app.use(passport.initialize());

// 📌 .env 환경변수 설정
const MONGO_URI = process.env.MONGO_URI;
const SECRET_KEY = process.env.SECRET_KEY;
const MQTT_host = process.env.MQTT_host;
const MQTT_ID = process.env.MQTT_ID;
const MQTT_PW = process.env.MQTT_PW;
const KAKAO_REST_API_KEY = process.env.REACT_APP_KAKAO_REST_API_KEY;
const KAKAO_REDIRECT_URI = process.env.REACT_APP_KAKAO_REDIRECT_URI;
const KAKAO_CLIENT_API_KEY = process.env.REACT_APP_KAKAO_CLIENT_API_KEY;

// 📌 MongoDB 연결 (직접 URI 포함)
let uri = MONGO_URI;
mongoose
  .connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// 📌 JWT Secret Key (직접 포함)
const JWT_SECRET = SECRET_KEY; // 보안상 환경변수로 설정하는 게 좋음

// 📌 User Schema
const userSchema = new mongoose.Schema({
  username: String, //id
  password: String, //pw
  kakaoId: String,
  renttime: Date, //대여시간
  returntime: Date, //반납시간간
  isRenting: { type: Boolean, default: false }, //사용자가 대여중인가?
});

const User = mongoose.model("User", userSchema);

/* 사용 안할거임
// 📌 우산 Schema
const umbrellaSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  rentedAt: Date,
  returned: Boolean,
});

const Umbrella = mongoose.model("Umbrella", umbrellaSchema);
*/
// 📌 JWT 인증 미들웨어
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // "Bearer 토큰"에서 "토큰"만 추출

  if (!token) return res.status(401).json({ message: "토큰이 없습니다." });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err)
      return res.status(403).json({ message: "토큰이 유효하지 않습니다." });
    req.user = user;
    next();
  });
};

// 📌 MQTT 연결 (HiveMQ public broker)
//const client = mqtt.connect("mqtt://broker.hivemq.com"); //TEST할때때

const options = {
  host: MQTT_host,
  port: 8883,
  protocol: "mqtts", // s 붙여야 TLS 연결
  username: MQTT_ID,
  password: MQTT_PW,
};
const client = mqtt.connect(options);

/*
client.on("connect", () => {
  console.log("MQTT publish connected(발행자 연결)");
});
*/
// 홀센서 상태를 저장할 변수 (기본적으로 "우산 없음" 상태)
let sensorStatus = {
  QR: true, //실험할 땐 true
  "1-1": false,
  "1-2": false,
  "1-3": false,
  "2-1": false,
  "2-2": false,
  "2-3": false,
};

// MQTT 연결 후 구독
client.on("connect", () => {
  console.log("MQTT 클라이언트 연결됨");
  // 각 자리별 홀센서 상태 구독
  client.subscribe("umbrella/status/QR", (err) => {
    if (err) console.log(err);
  });
  client.subscribe("umbrella/status/1-1", (err) => {
    if (err) console.log(err);
  });
  client.subscribe("umbrella/status/1-2", (err) => {
    if (err) console.log(err);
  });
  client.subscribe("umbrella/status/1-3", (err) => {
    if (err) console.log(err);
  });
  client.subscribe("umbrella/status/2-1", (err) => {
    if (err) console.log(err);
  });
  client.subscribe("umbrella/status/2-2", (err) => {
    if (err) console.log(err);
  });
  client.subscribe("umbrella/status/2-3", (err) => {
    if (err) console.log(err);
  });
});

// MQTT 메시지 수신 후 처리
client.on("message", (topic, message) => {
  const seat = topic.split("/")[2]; // 토픽에서 자리 번호 추출
  const status = message.toString(); // ("우산 있음", "우산 없음")

  // 상태 저장
  sensorStatus[seat] = status === "우산 있음";

  console.log(`받은 메시지: ${seat} 자리 상태 - ${status}`);
});

// 여기서 부터 페이지 api
app.use(express.static(path.join(__dirname, "build")));
/*
// 📌 회원가입 API
app.post("/api/signup", async (req, res) => {
  const { username, password } = req.body;

  // 중복 체크
  const existingUser = await User.findOne({ username });
  if (existingUser)
    return res.status(400).json({ message: "이미 존재하는 사용자입니다." });

  // 비밀번호 해싱
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = new User({ username, password: hashedPassword });
  await newUser.save();

  res.json({ message: "회원가입 성공!" });
});
*/
// 📌 회원가입 API
app.post("/api/signup", async (req, res) => {
  const { username, password } = req.body;

  // 입력값 검증
  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "아이디와 비밀번호를 모두 입력해주세요." });
  }

  // 중복 체크
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    return res.status(400).json({ message: "이미 존재하는 사용자입니다." });
  }

  // 비밀번호 해싱
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = new User({ username, password: hashedPassword });
  await newUser.save();

  res.status(201).json({ message: "회원가입 성공!" }); // 201 Created 상태 코드
});
/*
// 로그인
app.post("/api/Login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "잘못된 로그인 정보입니다." });
  }

  const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "1h" });
  res.json({ token, username: user.username }); // 사용자 이름도 반환
});
*/
// 로그인 라우트
app.post("/api/login", async (req, res) => {
  // 경로를 소문자로 변경
  try {
    const { username, password } = req.body;
    console.log("로그인 요청:", { username }); // 디버깅용

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: "존재하지 않는 사용자입니다." });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "비밀번호가 일치하지 않습니다." });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "1h",
    });

    console.log("로그인 성공:", { username }); // 디버깅용

    res.json({
      success: true,
      token,
      username: user.username,
    });
  } catch (error) {
    console.error("서버 에러:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

// 📌 카카오 로그인 설정
passport.use(
  new KakaoStrategy(
    {
      clientID: KAKAO_REST_API_KEY,
      clientSecret: KAKAO_CLIENT_API_KEY,
      callbackURL: KAKAO_REDIRECT_URI,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ kakaoId: profile.id });
        if (!user) {
          user = new User({
            username: `kakao_${profile.id}`,
            kakaoId: profile.id,
            password: await bcrypt.hash(
              crypto.randomBytes(16).toString("hex"),
              10
            ),
          });
          await user.save();
        }
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
          expiresIn: "1h",
        });
        return done(null, { username: user.username, token });
      } catch (err) {
        return done(err);
      }
    }
  )
);

// 📌 카카오 로그인 콜백
app.get("/auth/kakao/callback", async (req, res) => {
  const { code } = req.query;

  try {
    // ✅ 카카오 토큰 요청
    const tokenResponse = await axios.post(
      "https://kauth.kakao.com/oauth/token",
      null,
      {
        params: {
          grant_type: "authorization_code",
          client_id: KAKAO_REST_API_KEY,
          redirect_uri: KAKAO_REDIRECT_URI,
          code,
          client_secret: KAKAO_CLIENT_API_KEY,
        },
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    console.log("카카오 토큰 응답:", tokenResponse.data); // 👈 추가

    const { access_token } = tokenResponse.data;

    // ✅ 카카오 사용자 정보 요청
    const userResponse = await axios.get("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    console.log("카카오 사용자 정보:", userResponse.data); // 👈 추가

    // ✅ MongoDB에서 사용자 찾기
    let user = await User.findOne({ kakaoId: userResponse.data.id });
    console.log("DB에서 찾은 사용자:", user);

    if (!user) {
      user = new User({
        username: userResponse.data.kakao_account.profile.nickname,
        kakaoId: userResponse.data.id,
        password: await bcrypt.hash(crypto.randomBytes(16).toString("hex"), 10),
      });

      try {
        await user.save();
        console.log("사용자 저장 성공:", user);
      } catch (error) {
        console.error("사용자 저장 실패:", error);
      }
    }

    // ✅ JWT 토큰 발급
    const jwtToken = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "1h",
    });
    console.log("발급된 JWT 토큰:", jwtToken);

    // ✅ 리다이렉트 URL 업데이트
    redirectUrl = `/?username=${user.username}&token=${jwtToken}`;
  } catch (error) {
    console.error("카카오 로그인 실패:", error);
  }

  res.redirect(redirectUrl);
});

/* //여기는 react-qr-reader방식
// 📌 우산 대여 API (로그인 필요)
app.post('/api/Rent', authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    // 이미 대여한 우산이 있는지 확인
    const existingRental = await Umbrella.findOne({ userId, returned: false });
    if (existingRental) return res.status(400).json({ message: '이미 대여한 우산이 있습니다.' });

    const umbrella = new Umbrella({ userId, rentedAt: new Date(), returned: false });
    await umbrella.save();

    res.json({ message: '우산 대여 완료' });
});
// 📌 우산 반납 API (로그인 필요)
app.post('/api/Return', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { qrData } = req.body;

    // QR 데이터 유효성 검사 (예: 특정 형식이나 값 확인)
    if (!qrData || qrData !== 'expectedQrData') {
        return res.status(400).json({ message: '유효하지 않은 QR 코드입니다.' });
    }

    const umbrella = await Umbrella.findOne({ userId, returned: false });
    if (!umbrella) return res.status(400).json({ message: '대여한 우산이 없습니다.' });

    umbrella.returned = true;
    await umbrella.save();

    res.json({ message: '우산 반납 완료' });
});
*/

/* //잠시 대기
//여기는 react-html5-qrcode 방식
// 대여 요청 API
app.post("/api/rent", (req, res) => {
  const { seat } = req.body; // QR 코드에서 읽은 자리 번호

  if (!seat) {
    return res.status(400).json({ message: "자리 번호가 없습니다." });
  }

  console.log(`대여 요청이 접수됨: ${seat}`);

  // 여기에서 데이터베이스 저장 또는 처리 로직 추가 가능
  // 예제에서는 단순 응답만 반환
  client.publish(`umbrella/${seat}`, "run"); //QR 인식되면 QR번호와 일치하는 서보모터 동작 요청 MQTT로 발행
  console.log(`${seat}번 모터 버튼 동작함함`);
  //res.send("MQTT Servo run command sent");
  return res.json({ message: `${seat} 번 자리의 대여 요청이 완료되었습니다.` });
});
*/
/*
// 대여 요청 API
app.post("/api/rent", authenticateToken, async (req, res) => {
  const { seat } = req.body; // QR 코드에서 읽은 자리 번호

  if (!seat) {
    return res.status(400).json({ message: "자리 번호가 없습니다." });
  }

  console.log(`대여 요청이 접수됨: ${seat}`);

  // 홀센서 상태 확인
  if (sensorStatus[seat]) {
    // 자석이 감지되었을 때 서보모터 동작 요청
    //client.publish(`umbrella/${seat}`, `${seat} run`);
    //console.log(`${seat}번 모터 버튼 동작함`);

    // 대여 시간 설정
    const rentTime = new Date(); // 현재 시간

    // 대여 정보를 DB에 저장 (예: User 모델 사용)
    const user = await User.findOne({ _id: req.user.userId });
    if (user) {
      user.renttime = rentTime; // 대여 시간 저장
      await user.save(); // 변경 사항 저장
    }

    // 대여 완료 응답
    return res.json({
      message: `${seat}번 자리의 대여 요청이 완료되었습니다.`,
    });
  } else {
    // 자석이 감지되지 않았을 때 "우산 없음" 메시지 반환
    console.log(`${seat}번 자리에 우산이 없습니다.`);
    return res.status(400).json({
      message: "해당 자리에 우산이 없습니다. 다른 보관함을 이용해 주세요.",
    });
  }
});

//결제 완료후 모터 동작
app.post("/api/payment/complete", async (req, res) => {
  const { seat, orderId, amount } = req.body;

  try {
    if (!sensorStatus[seat]) {
      return res.status(400).json({ message: "해당 자리에 우산이 없습니다." });
    }

    // 모터 작동 요청
    client.publish(`umbrella/${seat}`, `${seat} run`);
    console.log(`대여 결제 후 ${seat}번 모터 작동 요청 완료`);

    // DB 저장이 필요하면 여기서 저장 로직 추가 가능

    return res.json({ message: "모터 작동 완료" });
  } catch (err) {
    console.error("모터 작동 요청 중 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});
*/

app.post("/api/rent", authenticateToken, async (req, res) => {
  //const userId = req.user.userId;
  const { seat, paid } = req.body;

  if (!seat) {
    return res.status(400).json({ message: "자리 번호가 없습니다." });
  }

  console.log(`대여 요청이 접수됨: ${seat}, 결제완료여부: ${paid}`);

  // 홀센서로 자리 확인
  if (!sensorStatus[seat]) {
    return res.status(400).json({ message: "해당 자리에 우산이 없습니다." });
  }

  // 사용자 정보 가져옴옴
  const user = await User.findOne({ _id: req.user.userId });
  if (!user)
    return res.status(404).json({ message: "사용자 정보가 없습니다." });

  // 이미 대여 중인지 확인
  if (user.isRenting) {
    return res
      .status(400)
      .json({
        message:
          "이미 대여중인 우산이 있습니다. 대여중인 우산을 반납하고 진행해 주세요.",
      });
  }

  const rentTime = new Date();
  user.renttime = rentTime;
  await user.save();

  if (paid) {
    // ✅ 결제까지 완료된 경우 → 모터 동작
    client.publish(`umbrella/${seat}`, `${seat} run`);
    console.log(`대여 결제 후 ${seat}번 모터 작동 요청 완료`);
    user.isRenting = true; // 대여 중 상태로 변경
    await user.save();
  }

  return res.json({
    message: paid
      ? `${seat}번 우산 대여가 완료되었습니다.`
      : `${seat}번 우산 대여 요청이 접수되었습니다.`,
  });
});

/* 여기까지는 된거임
// 📌 우산 반납 API (로그인 필요)
app.post("/api/return", authenticateToken, async (req, res) => {
  const { seat } = req.body; // QR 코드에서 읽은 자리 번호

  if (!seat) {
    return res.status(400).json({ message: "자리 번호가 없습니다." });
  }

  console.log(`반납 요청이 접수됨: ${seat}`);

  // 홀센서 상태 확인
  if (!sensorStatus[seat]) { //sensorStatus[seat] == 0
    // 자석이 감지 되지 않았을 때 서보모터 동작 요청
    //client.publish(`umbrella/${seat}`, `${seat} run`);
    //console.log(`${seat}번 모터 버튼 동작함`);

    // 반납 시간 설정
    const returnTime = new Date(); // 현재 시간

    // 반납 정보를 DB에 저장 (예: User 모델 사용)
    const user = await User.findOne({ _id: req.user.userId });
    if (user) {
      user.returntime = returnTime; // 대여 시간 저장
      await user.save(); // 변경 사항 저장
    }

    // 📌 대여 시간 ~ 반납 시간 차이 계산
    const rentTime = new Date(user.renttime);
    const timeDiffMs = returnTime - rentTime;

    const diffHours = Math.floor(timeDiffMs / (1000 * 60 * 60));
    let extraFee = 0;
    if (timeDiffMs > 86400000) { // 24시간 = 86400000ms
      extraFee = (diffHours - 24) * 100;
    }
    console.log(`대여한 시간 : ${diffHours}`);

    // 반납 완료 응답
    return res.json({
      message: `${seat}번 자리의 반납 요청이 완료되었습니다.`,
      extraFee: extraFee,
    });
  } else {
    // 자석이 감지되었을 때 "우산 있음" 메시지 반환
    console.log(`${seat}번 자리에 이미 우산이 있습니니다.`);
    return res.status(400).json({
      message: "해당 자리에 우산이 있습니다. 다른 보관함을 이용해 주세요.",
    });
  }
});

// 📌 반납 결제 완료 후 호출되는 API
app.post("/api/return/complete", async (req, res) => {
  const { seat, orderId, amount } = req.body;

  console.log(`추가요금 결제 완료. 반납 모터 작동 시작: ${seat}`);

  // 모터 작동
  client.publish(`umbrella/${seat}`, `${seat} run`);

  return res.json({
    message: `${seat}번 우산 반납이 완료되었습니다.`,
  });
});
*/

app.post("/api/return", authenticateToken, async (req, res) => {
  //const userId = req.user.userId;
  const { seat, paid } = req.body;

  if (!seat) return res.status(400).json({ message: "자리 번호 누락" });

  const user = await User.findOne({ _id: req.user.userId });
  if (!user) return res.status(404).json({ message: "사용자 없음" });

  // 우산 상태 확인 (예: sensorStatus 객체에서 확인)
  if (sensorStatus[seat]) {
    // 우산이 있는 경우
    return res.status(400).json({ message: "해당 자리에 우산이 있습니다." });
  }

  const returnTime = new Date();
  const rentTime = new Date(user.renttime);
  const diffMs = returnTime - rentTime;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  const extraFee = diffMs > 86400000 ? (diffHours - 24) * 100 : 0;

  // 👉 24시간 초과인데 결제 안 했으면 결제 안내만
  if (extraFee > 0 && !paid) {
    return res.json({
      message: "추가요금이 발생했습니다. 결제를 진행해주세요.",
      extraFee,
    });
  }

  // ✅ 조건 만족 시 모터 동작 (24시간 이내 or 결제 완료됨)
  client.publish(`umbrella/${seat}`, `${seat} run`);
  console.log(`반납 결제 후 ${seat}번 모터 작동 요청 완료`);
  user.returntime = returnTime;
  user.isRenting = false; // 대여 중 상태 해제
  await user.save();

  return res.json({
    message: `${seat}번 우산이 반납되었습니다.`,
    extraFee: 0,
  });
});

// 📌 파손/분실 처리 API (수수료 결제 후)
app.post("/api/return/damage", authenticateToken, async (req, res) => {
  console.log("파손/분실 API 호출됨"); // 로그 추가
  console.log("요청 body:", req.body); // 로그 추가
  
  const user = await User.findOne({ _id: req.user.userId });
  if (!user) {
    return res.status(404).json({ message: "사용자 정보를 찾을 수 없습니다." });
  }

  if (!user.isRenting) {
    return res.status(400).json({ message: "현재 대여 중인 우산이 없습니다." });
  }

  // 파손/분실 처리: isRenting 해제
  user.isRenting = false;
  user.returntime = new Date(); // 반납 처리 시점 기록
  await user.save();

  return res.json({ message: "파손/분실 처리가 완료되었습니다. 앞으로 대여 가능합니다." });
});

// React 라우팅을 위한 설정
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

const PORT = 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
