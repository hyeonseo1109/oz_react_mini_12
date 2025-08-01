import { useState } from "react";
import { useSupabase } from "../supabase/context";
import { useNavigate } from "react-router-dom";

export default function Auth() {
  const { supabaseClient, isSignInMode, isDark } = useSupabase(); 
  //contextAPI로 생성한 supabase와 관련된 전역상태들 가져오기
  const navigate = useNavigate();

  //사용자 입력 상태 관리하기
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  //유효성 검사
  const validateInputs = () => {
    const nameRegex = /^[가-힣a-zA-Z0-9]{2,8}$/;
    // 한글 / 영문 / 숫자 => 2~8자 허용
    // ^: 문자열의 시작(부터 검사하겠다)
    // $: 문자열의 끝
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)[A-Za-z\d]{6,}$/;
    // 알파벳 대문자 또는 소문자, 숫자 => 6자 이상

    if (!isSignInMode && !nameRegex.test(name)) {
      //로그인모드가 아닐 때,  name이 정규식 조건에 맞지 않을 때 
      return "이름은 2~8자의 한글, 영문, 숫자만 사용할 수 있습니다.";
    }
    if (!email.includes("@") || !email.includes(".")) {
      return "유효한 이메일 형식을 입력해주십시오.";
    }
    if (!passwordRegex.test(password)) {
      return "비밀번호는 영어 대소문자와 숫자를 포함해야 합니다.";
    }
    if (!isSignInMode && password !== confirmPassword) {
      return "비밀번호가 일치하지 않습니다.";
    }
    return null;
  };

  const signUp = async () => {
    const validationError = validateInputs();
    if (validationError) {
      setError(validationError);
      return;
    }

    const { error } = await supabaseClient.auth.signUp({
      // Supabase auth API 호출 - 회원가입
      // options.data에 name을 넣어 사용자 메타데이터로 저장
      email,
      password,
      options: { data: { name } },
    });
    if (error) {
      if (error.message === "User already registered") {
        setError("이미 가입된 계정입니다.");
      } else {
        setError(error.message);
      }
    } else {
      setMessage("회원가입 성공! 로그인을 진행해주세요.");
    }
  };

  // 로그인 함수
  const signIn = async () => {
    setError(null);
    setMessage(null);
    // Supabase 로그인 API 호출 (비밀번호 방식)
    const { error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setError("로그인에 실패했습니다.");
    else {
      setMessage("로그인 성공!");
      navigate("/");
      //로그인 성공 시 메인화면으로 이동
    }
  };


  return (
    <div className={`${isDark ? "background" : "bg-white" } w-full min-h-screen`}>
      <div className="flex flex-col gap-3 max-w-sm mx-auto py-30 px-5 ">
        {!isSignInMode && (
          <input
            type="text"
            placeholder="이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="p-2 border rounded bg-white"
          />
        )}
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="p-2 border rounded bg-white"
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="p-2 border rounded bg-white"
        />
        {!isSignInMode && (
          <input
            type="password"
            placeholder="비밀번호 확인"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="p-2 border rounded bg-white"
          />
        )}
        <div className="flex gap-2">
          {!isSignInMode ? (
            <button
              onClick={signUp}
              className="flex-1 bg-blue-600 text-white p-2 rounded"
            >
              회원가입
            </button>
          ) : (
            <button
              onClick={signIn}
              className="flex-1 bg-blue-600 text-white p-2 rounded"
            >
              로그인
            </button>
          )}
        </div>
        {error && <p className="text-red-600">{error}</p>}
        {message && <p className="text-green-600">{message}</p>}
      </div>
    </div>
  );
}