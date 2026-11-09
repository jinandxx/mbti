"use strict";
const $ = id => document.getElementById(id);
const STORAGE_KEY = "villain-test-v2-16";
let answers = [], current = 0, locked = false, timer, toastTimer, result;
function notify(message) { $("toast").textContent = message; $("toast").classList.add("visible"); clearTimeout(toastTimer); toastTimer = setTimeout(() => $("toast").classList.remove("visible"), 3500); }
function save() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify({answers,current})); } catch { notify("진행 기록을 저장할 수 없어 새로고침하면 초기화돼요."); } }
function load() { try { const s = JSON.parse(localStorage.getItem(STORAGE_KEY)); if (s && Array.isArray(s.answers) && s.answers.length <= 16 && s.answers.every(a => a === 0 || a === 1) && Number.isInteger(s.current) && s.current >= 0 && s.current <= s.answers.length && s.current < 16) return s; } catch {} return null; }
function show(screen) { clearTimeout(timer); locked = false; document.querySelectorAll(".screen").forEach(el => el.hidden = el.id !== screen); window.scrollTo(0,0); }
function start() { answers = []; current = 0; result = null; save(); renderQuestion(); }
function renderQuestion() {
  show("question-screen"); const q = QUESTIONS[current];
  $("question-count").textContent = `Q ${String(current+1).padStart(2,"0")} / 16 · ${Math.round(current/16*100)}%`;
  $("progress").setAttribute("aria-valuenow", current); $("progress-fill").style.width = `${current/16*100}%`;
  $("question-category").textContent = q.category; $("question-emoji").textContent = q.emoji; $("question-title").textContent = q.text; $("back-button").disabled = current === 0;
  $("answers").replaceChildren(...q.options.map((option,index) => { const button = document.createElement("button"); button.className = "answer" + (answers[current] === index ? " selected" : ""); button.setAttribute("aria-pressed", answers[current] === index); const label = document.createElement("span"); label.textContent = index === 0 ? "A" : "B"; button.append(label,document.createTextNode(option.text)); button.addEventListener("click",() => choose(index,button)); return button; }));
  $("question-title").focus({preventScroll:true});
}
function choose(index,button) {
  if (locked) return; locked = true; answers[current] = index; button.classList.add("selected"); button.setAttribute("aria-pressed","true");
  document.querySelectorAll(".answer").forEach(el => el.disabled = true);
  save(); timer = setTimeout(() => { if(current === QUESTIONS.length-1) renderResult(); else { current++; save(); renderQuestion(); } }, 220);
}
function calculate(values) {
  if (values.length !== 16 || !values.every(a => a === 0 || a === 1)) throw new Error("모든 질문에 답해주세요.");
  const counts = Object.fromEntries("EISNTFJP".split("").map(c => [c,0])); let power = 0;
  values.forEach((answer,i) => { const option = QUESTIONS[i].options[answer]; counts[option.code]++; power += option.power; });
  const code = ["EI","SN","TF","JP"].map(pair => { if(counts[pair[0]] === counts[pair[1]]) { const first = QUESTIONS.findIndex(q => pair.includes(q.options[0].code)); return QUESTIONS[first].options[values[first]].code; } return counts[pair[0]] > counts[pair[1]] ? pair[0] : pair[1]; }).join("");
  return {code, power:Math.round(power / (QUESTIONS.length*3)*100)};
}
function renderResult() {
  if (answers.length !== 16) return renderQuestion();
  result = calculate(answers); const r = RESULTS[result.code]; show("result-screen");
  $("result-code").textContent = result.code; $("result-emoji").textContent = r.emoji; $("result-title").textContent = r.name; $("result-quote").textContent = `“${r.quote}”`; $("result-description").textContent = r.description;
  const grade = result.power < 25 ? "순한맛 빌런" : result.power < 50 ? "은근한 빌런" : result.power < 75 ? "반전 빌런" : "최종 보스";
  $("power-label").textContent = `${result.power}% · ${grade}`; $("power-fill").style.width = `${result.power}%`; $("result-strength").textContent = r.strength; $("result-trigger").textContent = r.trigger; $("result-match").textContent = r.match; $("share-fallback").hidden = true; $("result-title").focus({preventScroll:true}); save();
}
function shareText() { const r = RESULTS[result.code]; const text = `내 안의 빌런은 ${r.emoji} ${r.name}! ${result.code} · 빌런력 ${result.power}%\n너의 숨겨진 본캐도 찾아봐!`; return location.protocol === "file:" ? text : `${text}\n${location.href.split("#")[0]}`; }
async function copyShare() { try { if(!navigator.clipboard) throw new Error(); await navigator.clipboard.writeText(shareText()); notify("공유 문구를 복사했어요!"); } catch { $("share-fallback").hidden = false; $("share-text").value = shareText(); $("share-text").focus(); $("share-text").select(); notify("선택된 문구를 길게 누르거나 Ctrl+C로 복사해 주세요."); } }
$("start-button").addEventListener("click",start);
$("resume-button").addEventListener("click",() => { const saved = load(); if(!saved) return start(); answers = saved.answers; current = saved.current; if(answers.length === 16) renderResult(); else renderQuestion(); });
$("back-button").addEventListener("click",() => { if(current > 0) { current--; save(); renderQuestion(); } });
$("brand").addEventListener("click",event => { event.preventDefault(); show("start-screen"); $("resume-button").hidden = !load(); $("start-button").focus(); });
$("restart-button").addEventListener("click",start);
$("share-button").addEventListener("click",async () => { if(!result) return; if(navigator.share && location.protocol !== "file:") { try { await navigator.share({title:"내 안의 빌런 찾기",text:shareText()}); return; } catch(error) { if(error.name === "AbortError") return; } } await copyShare(); });
$("copy-button").addEventListener("click",copyShare);
$("download-button").addEventListener("click",() => {
  try { const r = RESULTS[result.code]; const canvas = document.createElement("canvas"); canvas.width=900; canvas.height=1100; const ctx = canvas.getContext("2d"); ctx.fillStyle="#f8f5ff";ctx.fillRect(0,0,900,1100);ctx.textAlign="center";ctx.fillStyle="#8060cc";ctx.font="bold 25px sans-serif";ctx.fillText("내 안의 빌런 찾기",450,95);ctx.font="150px sans-serif";ctx.fillText(r.emoji,450,310);ctx.fillStyle="#29243b";ctx.font="bold 32px sans-serif";ctx.fillText(result.code,450,395);ctx.font="bold 46px sans-serif";ctx.fillText(r.name,450,480);ctx.font="24px sans-serif";ctx.fillText(`“${r.quote}”`,450,550);ctx.fillStyle="#8060cc";ctx.font="bold 42px sans-serif";ctx.fillText(`빌런력 ${result.power}%`,450,665);ctx.fillStyle="#29243b";ctx.font="26px sans-serif";ctx.fillText(`숨겨진 무기 · ${r.strength}`,450,770);ctx.fillText(`흑화 트리거 · ${r.trigger}`,450,825);ctx.fillStyle="#767084";ctx.font="20px sans-serif";ctx.fillText("너의 숨겨진 본캐도 소환해 봐!",450,960);ctx.font="17px sans-serif";ctx.fillText("공식 MBTI 검사가 아닌 오락용 성향 테스트",450,1010);canvas.toBlob(blob => { if(!blob) return notify("이미지 저장에 실패했어요. 다시 시도해 주세요."); const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`내안의빌런_${result.code}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify("결과 카드를 저장했어요."); },"image/png"); } catch { notify("이미지 저장에 실패했어요. 결과 공유를 이용해 주세요."); }
});
$("resume-button").hidden = !load();
