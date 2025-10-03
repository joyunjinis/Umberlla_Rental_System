//메인 홈 페이지, 로그인도 동시 관리, 회원가입시에만 SingUp.js로 리다이렉트
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo_img from "../images/log-removebg.png";
import logo_name from "../images/name.png";
import logo_kakao from "../images/kakao_login.png";

const Home = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(() => {
    return localStorage.getItem("user") || null;
  });
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const username = params.get("username");

    if (token && username) {
      localStorage.setItem("user", username);
      localStorage.setItem("token", token);
      setLoggedInUser(username);
      navigate("/"); // 메인으로
    }
  }, []);

  const signupClick = () => {
    navigate("/signup");
  };

  const handleKakaoLogin = () => {
    setIsLoading(true);
    const REST_API_KEY = process.env.REACT_APP_KAKAO_REST_API_KEY;
    const redirect_uri = process.env.REACT_APP_KAKAO_REDIRECT_URI;
    const kakaoURL = `https://kauth.kakao.com/oauth/authorize?client_id=${REST_API_KEY}&redirect_uri=${redirect_uri}&response_type=code`;
    window.location.href = kakaoURL;
  };

  const validateInputs = () => {
    if (!username.trim()) {
      setError("아이디를 입력해주세요.");
      return false;
    }
    if (!password.trim()) {
      setError("비밀번호를 입력해주세요.");
      return false;
    }
    if (password.length < 6) {
      setError("비밀번호는 최소 6자 이상이어야 합니다.");
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      setError("");
      if (!validateInputs()) {
        setIsLoading(false);
        return;
      }

      console.log("로그인 시도:", { username }); // 디버깅용

      const response = await fetch("/api/login", {
        // URL 수정
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
        credentials: "include", // 쿠키 포함
      });

      console.log("서버 응답 상태:", response.status); // 디버깅용

      const data = await response.json();
      console.log("서버 응답 데이터:", data); // 디버깅용

      if (response.ok) {
        localStorage.setItem("user", data.username);
        localStorage.setItem("token", data.token);
        setLoggedInUser(data.username);
        navigate("/");
      } else {
        throw new Error(data.message || "로그인에 실패했습니다.");
      }
    } catch (error) {
      console.error("로그인 에러:", error);
      setError("서버 연결에 실패했습니다. 서버가 실행 중인지 확인해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token"); // 토큰도 제거
    setLoggedInUser(null);
    navigate("/");
  };

  // 대여하기 페이지로 이동
  const handleRentClick = () => {
    navigate("/rent");
  };

  // 반납하기 페이지로 이동
  const handleReturnClick = () => {
    navigate("/return");
  };

  return (
    <div className="container1">
      <img src={logo_img} alt="제품 로고" className="log" />
      {loggedInUser ? (
        <div>
          <h3>{loggedInUser}님, 환영합니다!</h3>
          {/* 대여하기, 반납하기 버튼 */}
          <button onClick={handleRentClick}>우산 대여하기</button>
          <button onClick={handleReturnClick}>우산 반납하기</button>
          <button onClick={handleLogout}>로그아웃</button>
        </div>
      ) : (
        <div className="bottomwrapper">
          <img src={logo_name} alt="제품이름" className="name" />
          <div>
            <input
              type="text"
              placeholder="아이디"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
            />
            <input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button onClick={handleLogin} disabled={isLoading}>
            {isLoading ? "로그인 처리중..." : "로그인"}
          </button>
          <button onClick={signupClick} disabled={isLoading}>
            회원가입
          </button>
          {isLoading ? (
            <div className="loading-message">처리중...</div>
          ) : (
            <img
              src={logo_kakao}
              alt="카카오 로그인 버튼"
              className="kakao"
              onClick={handleKakaoLogin}
              style={{ cursor: "pointer" }}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default Home;
