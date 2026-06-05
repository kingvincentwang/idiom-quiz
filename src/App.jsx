import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

// 預設的成語題庫（當資料庫為空時供管理員一鍵匯入）
const defaultIdioms = [
  { idiom: "胸有成竹", definition: "比喻事前的準備充足，極有信心。", options: ["比喻事前的準備充足，極有信心。", "比喻不切實際的幻想。", "比喻隱瞞真相。", "比喻速度極快。"] },
  { idiom: "守株待兔", definition: "比喻拘泥守成，不知變通，或妄想不勞而獲。", options: ["比喻拘泥守成，不知變通。", "比喻動作敏捷。", "比喻見識廣博。", "比喻對人冷淡。"] },
  { idiom: "盲人摸象", definition: "比喻以偏概全，不能了解事情的全貌。", options: ["比喻以偏概全。", "比喻做事認真。", "比喻目光遠大。", "比喻大聲疾呼。"] },
  { idiom: "畫蛇添足", definition: "比喻多此一舉，不但無益，反而有害。", options: ["比喻多此一舉，反受其害。", "比喻追求完美。", "比喻精益求精。", "比喻畫技高超。"] }
];

export default function App() {
  const [idioms, setIdioms] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [quizOver, setQuizOver] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);

  // 後台管理狀態
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminMsg, setAdminMsg] = useState('');

  // 監聽登入狀態與獲取題目
  useEffect(() => {
    onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
    fetchIdioms();
  }, []);

  const fetchIdioms = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "idioms"));
      const list = querySnapshot.docs.map(doc => doc.data());
      // 隨機打亂題目順序
      setIdioms(list.sort(() => 0.5 - Math.random()));
    } catch (err) {
      console.error("讀取題庫失敗:", err);
    }
  };

  const handleAnswer = (option) => {
    if (selectedOption !== null) return;
    setSelectedOption(option);
    const correct = option === idioms[currentIndex].definition;
    setIsCorrect(correct);
    if (correct) setScore(score + 1);

    setTimeout(() => {
      if (currentIndex + 1 < idioms.length) {
        setCurrentIndex(currentIndex + 1);
        setSelectedOption(null);
        setIsCorrect(null);
      } else {
        setQuizOver(true);
      }
    }, 1500);
  };

  const resetQuiz = () => {
    setCurrentIndex(0);
    setScore(0);
    setQuizOver(false);
    setSelectedOption(null);
    setIsCorrect(null);
    fetchIdioms();
  };

  // 管理員登入與功能
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setAdminMsg("登入成功！");
    } catch (err) {
      setAdminMsg("登入失敗: " + err.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setAdminMsg("已登出");
  };

  const importDefaultIdioms = async () => {
    try {
      const batch = writeBatch(db);
      defaultIdioms.forEach((item) => {
        const docRef = doc(collection(db, "idioms"));
        batch.set(docRef, item);
      });
      await batch.commit();
      setAdminMsg("題庫匯入成功！請重新整理網頁。");
      fetchIdioms();
    } catch (err) {
      setAdminMsg("匯入失敗: " + err.message);
    }
  };

  return (
    <div class="min-h-screen flex flex-col">
      {/* 導覽列 */}
      <nav class="bg-slate-800 text-white px-6 py-4 flex justify-between items-center shadow-md">
        <h1 class="text-xl font-bold tracking-wider cursor-pointer" onClick={() => setIsAdminMode(false)}>🧠 成語知識大挑戰</h1>
        <button 
          onClick={() => setIsAdminMode(!isAdminMode)} 
          class="bg-slate-600 hover:bg-slate-700 px-4 py-1.5 rounded transition text-sm font-medium"
        >
          {isAdminMode ? "回測驗首頁" : "管理員後台"}
        </button>
      </nav>

      {/* 主內容區 */}
      <main class="flex-grow flex items-center justify-center p-4">
        {!isAdminMode ? (
          /* 前台測驗介面 */
          <div class="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full text-center">
            {idioms.length === 0 ? (
              <p class="text-gray-500 animate-pulse text-lg">題庫載入中，或請管理員至後台匯入題庫...</p>
            ) : quizOver ? (
              <div>
                <h2 class="text-3xl font-extrabold text-slate-800 mb-4">測驗結束！🎉</h2>
                <p class="text-xl mb-6 text-gray-600">你的得分：<span class="text-indigo-600 font-bold text-2xl">{score}</span> / {idioms.length}</p>
                <button onClick={resetQuiz} class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform transform hover:scale-105">再試一次</button>
              </div>
            ) : (
              <div>
                <div class="flex justify-between text-sm text-gray-400 mb-4 font-medium">
                  <span>題目：{currentIndex + 1} / {idioms.length}</span>
                  <span>目前得分：{score}</span>
                </div>
                <h3 class="text-5xl font-black text-indigo-900 my-8 tracking-widest">{idioms[currentIndex]?.idiom}</h3>
                <div class="space-y-4 text-left mt-6">
                  {idioms[currentIndex]?.options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(option)}
                      disabled={selectedOption !== null}
                      class={`w-full p-4 border-2 rounded-xl font-semibold text-lg transition-all duration-200 block text-center
                        ${selectedOption === null ? 'border-gray-200 hover:border-indigo-500 hover:bg-indigo-50/50' : ''}
                        ${selectedOption === option ? (isCorrect ? 'bg-green-500 border-green-500 text-white' : 'bg-red-500 border-red-500 text-white') : ''}
                        ${selectedOption !== option && option === idioms[currentIndex].definition && selectedOption !== null ? 'bg-green-500 border-green-500 text-white' : ''}
                      `}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* 後台管理介面 */
          <div class="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
            <h2 class="text-2xl font-bold text-gray-800 mb-6 text-center">🔐 管理員控制台</h2>
            {!user ? (
              <form onSubmit={handleLogin} class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-600 mb-1">電子信箱</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} class="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" required />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-600 mb-1">密碼</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} class="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" required />
                </div>
                <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-bold transition">登入後台</button>
              </form>
            ) : (
              <div class="text-center space-y-6">
                <p class="text-green-600 font-medium">歡迎登入！您可以管理線上資料庫</p>
                <button onClick={importDefaultIdioms} class="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-bold shadow transition">🚀 一鍵匯入預設成語題庫</button>
                <div class="border-t pt-4">
                  <button onClick={handleLogout} class="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-medium transition">登出帳號</button>
                </div>
              </div>
            )}
            {adminMsg && <p class="mt-4 text-sm text-center font-semibold text-slate-700 bg-slate-100 py-2 rounded-lg">{adminMsg}</p>}
          </div>
        )}
      </main>
    </div>
  );
}