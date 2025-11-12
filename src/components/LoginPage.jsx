import LoginForm from "./LoginForm";
import './LoginPage.css';

function LoginPage({ onLogin }){
  return(
    <>
      <img src="/logo-vertical.png" className="app-logo" alt="logo-universidad" />
      <LoginForm onLogin = {onLogin} />
    </>
  );
}

export default LoginPage;