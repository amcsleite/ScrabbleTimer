
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';

// --- HELPER COMPONENTS (ICONS) ---
const ResetIcon = () => React.createElement("svg", {
  xmlns: "http://www.w3.org/2000/svg",
  className: "h-8 w-8",
  fill: "none",
  viewBox: "0 0 24 24",
  stroke: "currentColor",
  strokeWidth: 2
}, React.createElement("path", {
  strokeLinecap: "round",
  strokeLinejoin: "round",
  d: "M4 4v5h5M20 20v-5h-5M4 4l1.5 1.5A9 9 0 0120.5 15M20 20l-1.5-1.5A9 9 0 003.5 9"
}));

const PauseIcon = () => React.createElement("svg", {
  xmlns: "http://www.w3.org/2000/svg",
  className: "h-8 w-8",
  fill: "none",
  viewBox: "0 0 24 24",
  stroke: "currentColor",
  strokeWidth: 2
}, React.createElement("path", {
  strokeLinecap: "round",
  strokeLinejoin: "round",
  d: "M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
}));


// --- HELPER FUNCTION ---
const formatTime = (totalSeconds) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

// --- MAIN APP COMPONENT ---
const App = () => {
  // --- STATE MANAGEMENT ---
  const [player1Time, setPlayer1Time] = useState(0);
  const [player2Time, setPlayer2Time] = useState(0);
  const [activePlayer, setActivePlayer] = useState(null);
  const wakeLockRef = useRef(null);


  // --- EFFECTS ---

  // Load state from localStorage on initial mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem('scrabbleTimerState');
      if (savedState) {
        const { p1Time, p2Time } = JSON.parse(savedState);
        setPlayer1Time(p1Time || 0);
        setPlayer2Time(p2Time || 0);
      }
    } catch (error) {
      console.error("Failed to load state from localStorage", error);
      localStorage.removeItem('scrabbleTimerState');
    }
    // App always starts paused as per requirements.
    setActivePlayer(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save state to localStorage whenever time changes
  useEffect(() => {
    // We only save the times, not the active player, so it starts paused on reload.
    const stateToSave = {
      p1Time: player1Time,
      p2Time: player2Time,
    };
    localStorage.setItem('scrabbleTimerState', JSON.stringify(stateToSave));
  }, [player1Time, player2Time]);

  // Timer tick logic
  useEffect(() => {
    let interval;

    if (activePlayer) {
      interval = window.setInterval(() => {
        if (activePlayer === 'player1') {
          setPlayer1Time(prev => prev + 1);
        } else if (activePlayer === 'player2') {
          setPlayer2Time(prev => prev + 1);
        }
      }, 1000);
    }

    return () => {
      if (interval) {
        window.clearInterval(interval);
      }
    };
  }, [activePlayer]);

  // Screen Wake Lock effect
  useEffect(() => {
    if (!('wakeLock' in navigator)) {
      console.warn('Screen Wake Lock API not supported. Screen may turn off.');
      return;
    }

    const requestWakeLock = async () => {
      try {
        if (!wakeLockRef.current || wakeLockRef.current.released) {
          const lock = await navigator.wakeLock.request('screen');
          wakeLockRef.current = lock;
          lock.addEventListener('release', () => {
            // This is called when the lock is released by the browser (e.g. tab hidden)
            wakeLockRef.current = null;
          });
        }
      } catch (err) {
        if (err.name === 'NotAllowedError') {
          console.warn('Screen Wake Lock was denied by the browser. The screen may turn off.');
        } else {
          console.error(`Failed to acquire Wake Lock: ${err.name}, ${err.message}`);
        }
      }
    };

    const releaseWakeLock = async () => {
      if (wakeLockRef.current && !wakeLockRef.current.released) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    };

    if (activePlayer) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && activePlayer) {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      releaseWakeLock(); // Release lock on component unmount
    };
  }, [activePlayer]);


  // --- EVENT HANDLERS ---

  const handlePlayerAreaClick = (tappedPlayer) => {
    // A player taps their side to end their turn, starting the opponent's timer.
    const opponent = tappedPlayer === 'player1' ? 'player2' : 'player1';
    setActivePlayer(opponent);
  };

  const handlePause = () => {
    setActivePlayer(null);
  };

  const handleReset = () => {
    setActivePlayer(null);
    setPlayer1Time(0);
    setPlayer2Time(0);
    localStorage.removeItem('scrabbleTimerState');
  };

  // --- RENDER LOGIC ---

  const player1IsActive = activePlayer === 'player1';
  const player2IsActive = activePlayer === 'player2';

  const totalTime = player1Time + player2Time;
  const player1Adjustment = totalTime > 0 ? (2 * player2Time) / totalTime : 1;
  const player2Adjustment = totalTime > 0 ? (2 * player1Time) / totalTime : 1;


  return React.createElement("main", {
    className: "h-screen w-screen flex flex-col bg-black text-white font-mono select-none overflow-hidden"
  }, React.createElement("section", {
    onClick: () => handlePlayerAreaClick('player2'),
    className: `flex-1 flex justify-center items-center cursor-pointer transition-colors duration-300 ease-in-out ${
          player2IsActive ? 'bg-green-600' : 'bg-gray-800 hover:bg-gray-700'
        }`
  }, React.createElement("div", {
    className: "transform rotate-180 flex flex-col items-center"
  }, React.createElement("span", {
    className: "text-8xl sm:text-9xl md:text-[10rem] font-bold tracking-wider"
  }, formatTime(player2Time)), React.createElement("span", {
    className: "text-2xl mt-4 font-normal tracking-normal text-white/80"
  }, "time adjustment: ", player2Adjustment.toFixed(2)))), React.createElement("nav", {
    className: "flex justify-center items-center gap-12 py-4 bg-black border-y-2 border-gray-600"
  }, React.createElement("button", {
    onClick: handleReset,
    className: "p-3 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-red-500/50",
    "aria-label": "Reset timers"
  }, React.createElement(ResetIcon, null)), React.createElement("button", {
    onClick: handlePause,
    className: "p-3 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-yellow-500/50",
    "aria-label": "Pause timer"
  }, React.createElement(PauseIcon, null))), React.createElement("section", {
    onClick: () => handlePlayerAreaClick('player1'),
    className: `flex-1 flex justify-center items-center cursor-pointer transition-colors duration-300 ease-in-out ${
          player1IsActive ? 'bg-green-600' : 'bg-gray-800 hover:bg-gray-700'
        }`
  }, React.createElement("div", {
    className: "flex flex-col items-center"
  }, React.createElement("span", {
    className: "text-8xl sm:text-9xl md:text-[10rem] font-bold tracking-wider"
  }, formatTime(player1Time)), React.createElement("span", {
    className: "text-2xl mt-4 font-normal tracking-normal text-white/80"
  }, "time adjustment: ", player1Adjustment.toFixed(2)))));
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  React.createElement(React.StrictMode, null, React.createElement(App, null))
);
