# 스마트 공공 우산 대여 시스템
### 성결대학교 정보통신공학과 졸업작품

---

## 📌 프로젝트 소개
- 갑작스러운 눈 & 비가 올 때 빠르게 공공 우산을 대여할 수 있는 시스템입니다.
- 웹/앱으로 접속한 사용자가 대여/반납 요청에 따라 우산을 대여할 수 있습니다.
- H/W, S/W, IoT, 통신 시스템 등 정보통신공학과에서 배우는 다양한 기술을 복합적으로 사용합니다.
- React 버전이 19로 업데이트됨에 따라 기존 React 사용자들은  
  \`\`\`bash
  npm install --legacy-peer-deps
  \`\`\`
  명령어를 통해 강제 v19 훅을 사용하도록 합니다.

---

## 팀원 구성

<div align="center">

| **이승헌** | **양한별** | **최성원** | **조윤서** | **조윤진** |
| :------: | :------: | :------: | :------: | :------: |
| [<img src="https://avatars.githubusercontent.com/lico0531" height=150 width=150><br/>@lico0531](https://github.com/lico0531) | [<img src="https://avatars.githubusercontent.com/luybnah" height=150 width=150><br/>@luybnah](https://github.com/luybnah) | [<img src="https://avatars.githubusercontent.com/s2865" height=150 width=150><br/>@s2865](https://github.com/s2865) | [<img src="https://avatars.githubusercontent.com/yunseo0227" height=150 width=150><br/>@yunseo0227](https://github.com/yunseo0227) | [<img src="https://avatars.githubusercontent.com/joyunjinis" height=150 width=150><br/>@joyunjinis](https://github.com/joyunjinis) |
</div>

---

## 📅 개발 기간
- 2024/09/01 ~ 개발 중

---

## 👨‍💻 개발 담당

**이승헌 (팀장)**  
- 주분야: H/W, IoT  
- 부분야: 통신 기술 스택, Backend/Frontend  
  - 웹/앱 Backend/Frontend 개발 지원 및 실험  
  - Raspberry Pi v5 초기 설정  
  - Raspberry Pi v5 GPIO Python 코드 작성  
  - 서보모터 및 홀센서 회로 연결  

**양한별**  
- 주분야: Backend  
- 부분야: Frontend  
  - 객체인식 카메라 모듈 연동  
  - 웹/앱 및 Flask 서버 연동  
  - 젯슨 나노 설정  

**최성원**  
- 주분야: Frontend  
- 부분야: IoT  
  - Flask 서버(app.py) 개발  
  - DB 구현  
  - 웹과 YOLOv8 모델 연동  

**조윤서**  
- 주분야: H/W, IoT  
- 부분야: 전자 회로  
  - 객체인식 카메라 모듈 연동 보조  
  - 웹/앱 및 Flask 서버 연동 보조  
  - 젯슨 나노 설정 보조  

**조윤진**  
- 주분야: Frontend  
- 부분야: Backend  
  - UI 구현  
  - Kakao 로그인 API 구현  

---

## 🛠️ 사용 기술
- **H/W:** Raspberry Pi v5  
- **Backend:** React (Node.js)  
- **Frontend:** HTML, CSS, JavaScript, React  
- **Database:** MongoDB  
- **통신:** RESTful API, Kakao API, Toss API, MQTT (HiveMQ)  

---

## 🎯 주요 기능
- 회원가입 / 로그인 / 로그아웃  
- 우산 대여 / 반납  
- 사용자 요청에 따른 H/W 동작  

---

## 📂 프로젝트 구조
\`\`\`
📂 flask_server/
├── 📂 static/             # 정적 파일 (CSS, JS, 이미지)
├── 📂 templates/          # HTML 파일
├── 📂 yolov8/             # YOLOv8 모델 관련 파일 (Git에 포함되지 않음)
├── 📂 venv/               # 가상 환경 (Git에 포함되지 않음)
├── 📂 app.py              # Flask 웹 서버
├── 📂 best.pt             # 학습된 YOLOv8 모델 가중치 (Git에 포함되지 않음)
├── 📂 requirements.txt    # 필요한 패키지 목록
└── 📂 README.md           # 프로젝트 설명
\`\`\`

---

## 📷 결과 화면
### ✅ 핸드폰(phone) 탐지 결과 화면  
![핸드폰 탐지](https://github.com/user-attachments/assets/a10e4540-7c80-4109-9bd8-6df4193f762b)

### ✅ 핸드폰(phone) 객체 탐지 로그  
![핸드폰 탐지 로그](https://github.com/user-attachments/assets/d8564a10-7ed5-410f-af4f-d537089ac659)

### ✅ 10초 동안 객체 탐지 후, 가장 높은 신뢰도를 가진 결과 저장  
![탐지 결과](https://github.com/user-attachments/assets/452a4f4a-bd6d-426d-9033-7a55f4fbc231)

### ✅ 펜(pen) 탐지 결과 화면  
![펜 탐지](https://github.com/user-attachments/assets/26137140-7b4e-415b-ba70-4c8904d34cbf)

### ✅ 펜(pen) 객체 탐지 로그  
![펜 탐지 로그](https://github.com/user-attachments/assets/917782fc-dc88-401a-b4d6-66261be416ea)

### ✅ 핸드폰(phone)과 노트북(laptop) 탐지 결과 화면  
![핸드폰과 노트북 탐지](https://github.com/user-attachments/assets/e54f2610-014a-4746-916d-0e18a3fe8e0f)

### ✅ 핸드폰(phone)과 노트북(laptop) 객체 탐지 로그  
![탐지 로그](https://github.com/user-attachments/assets/d4aa791b-7b8c-4786-9c3f-2222a8982b28)

---

## 🔗 프로젝트 블로그
- [YOLOv8 학습 및 모델 적용 과정](https://djjin02.tistory.com/205)  
- [객체 탐지 웹 애플리케이션 구현](https://djjin02.tistory.com/207)
EOF
