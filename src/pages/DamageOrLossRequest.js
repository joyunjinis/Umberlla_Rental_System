import { loadTossPayments } from "@tosspayments/payment-sdk";
import logo_img from "../images/log-removebg.png";
import { useEffect } from "react";

const DamageOrLossRequest = () => {
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
        orderName: "우산 파손/분실 수수료", // 나중에 몇번 우산 넣을 곳
        //customerName: "고객님",
        //customerEmail: "customer@example.com",
        successUrl: `${window.location.origin}/payments/complete`,
        failUrl: `${window.location.origin}/payments/fail`,
      });
    } catch (error) {
      console.error("결제 요청 중 오류:", error);
    }
  };

  return (
    <div className="container">
      <h2 style={{ color: "#1d4ed8", fontWeight: "bold", fontSize: "2rem" }}>
        우산 파손/분실
      </h2>
      <img src={logo_img} alt="제품 로고" className="log" />
      <p style={{ color: "#dc2626", fontWeight: "bold" }}>
        우산의 파손이나 분실로 인해 반납을 진행할 수 없습니까?
      </p>
      <p>반납이 완료되지 않으면 앞으로 대여 요청을 할 수 없습니다.</p>
      <button onClick={handleClick}>
        수수료 2000원 지불하고 반납 완료하기
      </button>
    </div>
  );
};

export default DamageOrLossRequest;
