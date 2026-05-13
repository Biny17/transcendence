package user

import (
	"backend/ent"
	"backend/ent/mailverif"
	"log"

	// "backend/ent/user"
	"context"
	"time"

	"github.com/danielgtaylor/huma/v2"
)

type CallbackIn struct {
	Token  string `query:"token"`
	UserID int    `query:"user_id"`
}

type CallBackOut struct {
	ContentType string `header:"Content-Type"`
	Body        []byte
}

func (us *UserService) ConfirmEmail(
	ctx context.Context,
	input *CallbackIn,
) (*CallBackOut, error) {
	if input.Token == "" || input.UserID <= 0 {
		return nil, huma.Error400BadRequest("invalid verification query")
	}
	mv, err := us.Client.MailVerif.Query().
		Where(mailverif.TokenEQ(input.Token)).
		Where(mailverif.UserIDEQ(input.UserID)).
		Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, huma.Error400BadRequest("invalid verification query")
		}
		return nil, huma.Error500InternalServerError("Server Error")
	}
	if mv.ExpiringAt.Before(time.Now()) {
		return nil, huma.Error400BadRequest("verification token expired")
	}
	user_q, err := us.Client.User.
		UpdateOneID(input.UserID).
		SetVerifiedEmail(true).
		Save(ctx)
	if err != nil {
		log.Print(err)
		return nil, huma.Error500InternalServerError("Server Error")
	}
	err = us.Client.MailVerif.DeleteOneID(mv.ID).Exec(ctx)
	if err != nil {
		log.Print(err)
	}
	return HtmlConfirmPage(user_q.Username), nil
}

func SeeConfirmPage(ctx context.Context, input *struct{}) (*CallBackOut, error) {
	return HtmlConfirmPage("THIS IS A TEST"), nil
}

func HtmlConfirmPage(username string) *CallBackOut {
	output := &CallBackOut{}
	output.ContentType = "text/html"
	output.Body = []byte(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>YOU'RE IN!!!</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Lilita+One&family=Nunito:wght@400;700;900&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --yellow: #FFE135;
    --pink: #FF4FC8;
    --cyan: #00F0FF;
    --green: #39FF14;
    --orange: #FF6B00;
    --bg: #0A0A1A;
  }

  body {
    background: var(--bg);
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Nunito', sans-serif;
    overflow: hidden;
    position: relative;
  }

  canvas#confetti {
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    pointer-events: none;
    z-index: 0;
  }

  .stars {
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    pointer-events: none;
    z-index: 0;
  }

  .star {
    position: absolute;
    background: white;
    border-radius: 50%;
    animation: twinkle var(--d) ease-in-out infinite;
  }

  @keyframes twinkle {
    0%, 100% { opacity: 0.1; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.4); }
  }

  .card {
    position: relative;
    z-index: 10;
    text-align: center;
    padding: 3rem 3.5rem 3rem;
    max-width: 580px;
    width: 90vw;
    border-radius: 32px;
    background: rgba(255,255,255,0.04);
    border: 2px solid rgba(255,255,255,0.1);
    backdrop-filter: blur(20px);
    animation: cardIn 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    opacity: 0;
    transform: scale(0.5) translateY(40px);
  }

  @keyframes cardIn {
    to { opacity: 1; transform: scale(1) translateY(0); }
  }

  .glow-ring {
    position: absolute;
    inset: -3px;
    border-radius: 34px;
    background: conic-gradient(from var(--angle), var(--pink), var(--cyan), var(--yellow), var(--green), var(--pink));
    z-index: -1;
    animation: spin 3s linear infinite;
    filter: blur(1px);
  }

  @property --angle {
    syntax: '<angle>';
    initial-value: 0deg;
    inherits: false;
  }

  @keyframes spin {
    to { --angle: 360deg; }
  }

  .checkmark-wrap {
    margin: 0 auto 1.5rem;
    width: 96px; height: 96px;
    position: relative;
  }

  .checkmark-bg {
    width: 96px; height: 96px;
    border-radius: 50%;
    background: var(--green);
    display: flex; align-items: center; justify-content: center;
    animation: popIn 0.5s 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
    box-shadow: 0 0 40px var(--green), 0 0 80px rgba(57, 255, 20, 0.3);
  }

  @keyframes popIn {
    from { transform: scale(0) rotate(-180deg); opacity: 0; }
    to { transform: scale(1) rotate(0deg); opacity: 1; }
  }

  .check-svg {
    width: 48px; height: 48px;
  }

  .check-path {
    stroke: #0A0A1A;
    stroke-width: 5;
    stroke-linecap: round;
    stroke-linejoin: round;
    fill: none;
    stroke-dasharray: 60;
    stroke-dashoffset: 60;
    animation: drawCheck 0.5s 0.9s ease forwards;
  }

  @keyframes drawCheck {
    to { stroke-dashoffset: 0; }
  }

  .headline {
    font-family: 'Lilita One', cursive;
    font-size: clamp(2.2rem, 6vw, 3.2rem);
    line-height: 1.1;
    color: white;
    animation: fadeUp 0.5s 0.6s ease both;
    letter-spacing: -0.5px;
  }

  .headline .hi {
    color: var(--yellow);
    display: block;
    font-size: 1.15em;
    text-shadow: 0 0 30px rgba(255, 225, 53, 0.6);
    animation: wiggle 1.5s 1.2s ease-in-out infinite;
  }

  @keyframes wiggle {
    0%, 100% { transform: rotate(-2deg); }
    50% { transform: rotate(2deg); }
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .subtext {
    margin: 1.1rem 0 0.4rem;
    font-size: 1rem;
    color: rgba(255,255,255,0.7);
    line-height: 1.6;
    animation: fadeUp 0.5s 0.8s ease both;
  }

  .bold-detail {
    font-weight: 900;
    color: var(--cyan);
  }

  .divider {
    margin: 1.6rem auto;
    width: 60px;
    height: 3px;
    border-radius: 2px;
    background: linear-gradient(90deg, var(--pink), var(--cyan));
    animation: fadeUp 0.5s 0.9s ease both;
  }

  .perks {
    list-style: none;
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: 10px;
    animation: fadeUp 0.5s 1s ease both;
    margin-bottom: 1.6rem;
  }

  .perks li {
    font-size: 0.92rem;
    color: rgba(255,255,255,0.75);
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .perk-icon {
    font-size: 1.1rem;
    flex-shrink: 0;
  }

  .cta-btn {
    display: inline-block;
    margin-top: 0.4rem;
    padding: 0.9rem 2.8rem;
    background: var(--yellow);
    color: #0A0A1A;
    font-family: 'Nunito', sans-serif;
    font-size: 1.05rem;
    font-weight: 900;
    border-radius: 50px;
    border: none;
    cursor: pointer;
    text-decoration: none;
    letter-spacing: 0.5px;
    box-shadow: 0 0 30px rgba(255, 225, 53, 0.5), 0 6px 20px rgba(0,0,0,0.3);
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    animation: fadeUp 0.5s 1.1s ease both;
    text-transform: uppercase;
  }

  .cta-btn:hover {
    transform: translateY(-3px) scale(1.04);
    box-shadow: 0 0 50px rgba(255, 225, 53, 0.8), 0 10px 30px rgba(0,0,0,0.3);
  }

  .cta-btn:active { transform: scale(0.97); }

  .fun-note {
    margin-top: 1.4rem;
    font-size: 0.78rem;
    color: rgba(255,255,255,0.3);
    animation: fadeUp 0.5s 1.2s ease both;
  }

  .fun-note span {
    color: var(--pink);
    font-weight: 700;
  }

  .floating-emoji {
    position: fixed;
    font-size: 2rem;
    pointer-events: none;
    z-index: 5;
    animation: floatUp var(--dur) ease-in forwards;
    opacity: 0;
  }

  @keyframes floatUp {
    0% { transform: translateY(0) rotate(0deg); opacity: 1; }
    100% { transform: translateY(-120vh) rotate(720deg); opacity: 0; }
  }

  .counter {
    font-family: 'Lilita One', cursive;
    font-size: 0.85rem;
    color: rgba(255,255,255,0.25);
    margin-top: 0.6rem;
    letter-spacing: 1px;
    animation: fadeUp 0.5s 1.3s ease both;
  }

  .counter span {
    color: var(--orange);
  }
</style>
</head>
<body>

<canvas id="confetti"></canvas>
<div class="stars" id="stars"></div>

<div class="card">
  <div class="glow-ring"></div>

  <div class="checkmark-wrap">
    <div class="checkmark-bg">
      <svg class="check-svg" viewBox="0 0 48 48">
        <path class="check-path" d="M10 24 L20 34 L38 14"/>
      </svg>
    </div>
  </div>

  <h1 class="headline">
    <span class="hi">` + username + `</span>
    Account Confirmed
  </h1>

  <p class="subtext">
    Your email has been verified. <span class="bold-detail">Congratulations.</span><br>
    You clicked a link. That is genuinely all you did.
  </p>

  <div class="divider"></div>

  <ul class="perks">
    <li><span class="perk-icon">🔓</span> You now have access to everything you already had access to</li>
    <li><span class="perk-icon">🏆</span> Achievement unlocked: <strong style="color:var(--yellow)">Email Opener</strong> (Legendary)</li>
    <li><span class="perk-icon">🛡️</span> Your inbox is now 0.001% more secure, probably</li>
    <li><span class="perk-icon">✨</span> You are now officially a <strong style="color:var(--cyan)">Verified Human™</strong></li>
  </ul>

  <a href="#" class="cta-btn" onclick="spawnEmojis(); return false;">
    🚀 Let's freaking go
  </a>

  <p class="fun-note">No login info was lost in the making of this page · <span>We're proud of you</span></p>
  <p class="counter">You are verified member #<span id="member-num">000000</span></p>
</div>

<script>
  // Stars background
  const starsEl = document.getElementById('stars');
  for (let i = 0; i < 80; i++) {
    const s = document.createElement('div');
    s.className = 'star';
    const size = Math.random() * 2.5 + 0.5;
    s.style.cssText = ` + "`" + `
      left:${Math.random()*100}%;
      top:${Math.random()*100}%;
      width:${size}px;
      height:${size}px;
      --d:${(Math.random()*3+1.5).toFixed(1)}s;
      animation-delay:${(Math.random()*4).toFixed(1)}s;
    ` + "`" + `;
    starsEl.appendChild(s);
  }

  // Fake member number
  const memberEl = document.getElementById('member-num');
  const target = Math.floor(Math.random() * 900000 + 50000);
  let current = 0;
  const step = Math.ceil(target / 60);
  const ticker = setInterval(() => {
    current = Math.min(current + step, target);
    memberEl.textContent = String(current).padStart(6, '0');
    if (current >= target) clearInterval(ticker);
  }, 16);

  // Confetti
  const canvas = document.getElementById('confetti');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });

  const COLORS = ['#FFE135','#FF4FC8','#00F0FF','#39FF14','#FF6B00','#ffffff','#B47BFF'];
  const pieces = [];

  for (let i = 0; i < 180; i++) {
    pieces.push({
      x: Math.random() * window.innerWidth,
      y: -20 - Math.random() * 600,
      r: Math.random() * 6 + 3,
      d: Math.random() * 2 + 1,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      tilt: Math.random() * 20 - 10,
      tiltAngle: 0,
      tiltSpeed: Math.random() * 0.1 + 0.04,
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
      w: Math.random() * 10 + 4,
      h: Math.random() * 5 + 3,
    });
  }

  function drawConfetti() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.tiltAngle);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = 0.85;
      if (p.shape === 'rect') {
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      p.y += p.d;
      p.tiltAngle += p.tiltSpeed;
      p.x += Math.sin(p.tiltAngle) * 0.8;
      if (p.y > canvas.height + 20) {
        p.y = -20;
        p.x = Math.random() * canvas.width;
      }
    });
    requestAnimationFrame(drawConfetti);
  }
  drawConfetti();

  // Emoji burst on button click
  function spawnEmojis() {
    const emojis = ['🎉','🥳','🎊','✨','💥','🚀','🌟','🎈','🔥','💫'];
    for (let i = 0; i < 18; i++) {
      const el = document.createElement('div');
      el.className = 'floating-emoji';
      el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      el.style.cssText = ` + "`" + `
        left:${20 + Math.random()*60}%;
        bottom:${10 + Math.random()*20}%;
        --dur:${(1.5 + Math.random()*1.5).toFixed(1)}s;
        animation-delay:${(Math.random()*0.4).toFixed(2)}s;
        font-size:${1.5 + Math.random()*2}rem;
      ` + "`" + `;
      document.body.appendChild(el);
      el.addEventListener('animationend', () => el.remove());
    }
  }

  setTimeout(spawnEmojis, 1200);
</script>
</body>
</html>`)
	return output
}
