import { loadTossPayments } from "@tosspayments/payment-sdk";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Rent = () => {
  const [data, setData] = useState("None");
  const [message, setMessage] = useState(""); // 나중에 ""으로 변경, 항시 읽음은 true
  const [isUmbrellaAvailable, setIsUmbrellaAvailable] = useState(true); // 우산 유무 상태 추가
  const [isScanning, setIsScanning] = useState(false); // 스캐닝 상태 추가
  let scanner; // 스캐너 인스턴스를 전역 변수로 선언
  const navigate = useNavigate();

  // 토큰 디버깅용 콘솔 로그
  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log("현재 저장된 토큰:", token);
    console.log("토큰이 있나요?", !!token);
  }, []);

  //결제 버튼 누를시 toss 페이먼츠로 이동
  const handleClick = async () => {
    //const uniqueId = "123";
    const orderId = `order-${Date.now()}`;

    const CLIENT_KEY = process.env.REACT_APP_TOSS_CLIENT_KEY;
    console.log("CLIENT_KEY:", CLIENT_KEY);

    try {
      const tossPayments = await loadTossPayments(CLIENT_KEY);

      await tossPayments.requestPayment("카드", {
        amount: "2000", //가격도 하드코딩 말고 컨포넌트로 넣을 예정정
        orderId: orderId,
        orderName: `${data}번 우산 대여`, // 나중에 몇번 우산 넣을 곳
        //customerName: "고객님",
        //customerEmail: "customer@example.com",
        successUrl: `${window.location.origin}/payments/complete`,
        failUrl: `${window.location.origin}/payments/fail`,
      });
    } catch (error) {
      console.error("결제 요청 중 오류:", error);
    }
  };

  // QR 코드 스캔 성공 시 처리 로직
  const handleScanSuccess = (decodedText) => {
    console.log("QR 코드 스캔 성공:", decodedText);
    setData(decodedText);

    const token = localStorage.getItem("token");
    fetch("/api/rent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ seat: decodedText }),
    })
      .then((res) => res.json())
      .then((resData) => {
        // 각 경우에 따라 처리
        if (resData.message === "해당 자리에 우산이 없습니다.") {
          console.log("경우1 : 우산함에 우산 없음");
          setMessage(resData.message);
          setIsUmbrellaAvailable(false); // 우산이 없는 상태로 설정
          stopScanner(); // 스캔 성공 후 스캐너 정리
        } else if (
          resData.message ===
          "이미 대여중인 우산이 있습니다. 대여중인 우산을 반납하고 진행해 주세요."
        ) {
          console.log("경우2 : 사용자가 이미 우산 대여중임");
          setMessage(resData.message);
          setIsUmbrellaAvailable(false); // 대여 중인 우산이 있는 상태로 설정
          stopScanner(); // 스캔 성공 후 스캐너 정리
        } else {
          console.log("경우3 : 정상적으로 대여 성공");
          setMessage(resData.message || "대여 요청 성공!");
          setIsUmbrellaAvailable(true); // 정상 대여 상태
          stopScanner(); // 스캔 성공 후 스캐너 정리
        }
      })
      .catch((error) => {
        console.error("대여 요청 실패:", error);
        setMessage("대여 요청 중 오류 발생");
      });
  };

  const startScanner = () => {
    if (scanner) {
      scanner.clear(); // 이전 스캐너 정리
    }
    scanner = new Html5QrcodeScanner("qr-reader", {
      fps: 10,
      qrbox: { width: 250, height: 250 },
    });

    scanner.render(handleScanSuccess, (error) => {
      console.error("QR 코드 스캔 오류:", error);
    });
    setIsScanning(true); // 스캐닝 상태 업데이트
  };

  const stopScanner = () => {
    if (scanner) {
      scanner.clear(); // 스캐너 정리
    }
    setIsScanning(false); // 스캐닝 상태 업데이트
  };

  useEffect(() => {
    startScanner(); // 컴포넌트가 마운트될 때 스캐너 시작

    return () => {
      stopScanner(); // 컴포넌트 언마운트 시 스캐너 정리
    };
  }, []);

  // 반납하기 페이지로 이동
  const handleReturnClick = () => {
    navigate("/return");
  };

  return (
    <div className="container">
      <h2>우산 대여</h2>
      <div id="qr-reader" style={{ width: "100%" }}></div>

      {message && (
        <div>
          <p>스캔된 자리 번호: {data}</p>
          <p>{message}</p>
          {isUmbrellaAvailable ? (
            <>
              <p>결제하시겠습니까?</p>
              <button onClick={handleClick}>결제 진행하기</button>
            </>
          ) : (
            <div>
              {message ==
              "이미 대여중인 우산이 있습니다. 대여중인 우산을 반납하고 진행해 주세요." ? (
                <>
                  <p>반납하시겠습니까?</p>
                  <button onClick={handleReturnClick}>우산 반납하기</button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setData("None"); // QR 코드 데이터 초기화
                    setMessage(""); // 메시지 초기화
                    stopScanner(); // QR 코드 스캐너 정리
                    startScanner(); // 새로운 스캐너 시작
                  }}
                >
                  QR 다시 찍기
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Rent;
