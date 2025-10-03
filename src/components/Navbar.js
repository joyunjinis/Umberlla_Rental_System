//모든 페이지에 항상 보이는 네브바는 컴포넌트로 따로 관리
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="navbar">
      <Link to="/">홈 화면</Link>
      <Link to="/rent">우산 대여</Link>
      <Link to="/return">우산 반납</Link>
      <Link to="/DamageOrLossRequest">파손/분실</Link>
    </nav>
  );
};

export default Navbar;
