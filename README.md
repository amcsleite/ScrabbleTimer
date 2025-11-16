# Scrabble Clock

A simple, full-screen, two-player Scrabble timer designed for an optimal mobile experience. This app provides a clean, distraction-free interface to manage time during a game of Scrabble or similar turn-based board games.

![Scrabble Clock Screenshot](https://placehold.co/600x400/171717/FFF?text=Scrabble%20Clock%20UI)
*(Suggestion: Replace this placeholder with a screenshot or GIF of your app in action!)*

---

## Features

-   **Two-Player Timer**: Separate, accumulating timers for each player.
-   **Full-Screen & Mobile-First**: The interface is designed to use the entire screen, with large, readable text perfect for placing between players on a table.
-   **Tap-to-Switch Turns**: Simply tap your side of the screen to stop your timer and start your opponent's.
-   **Pause & Reset**: Easily accessible controls to pause the game or reset both timers to zero.
-   **State Persistence**: The current time for both players is saved to the browser's `localStorage`. If you accidentally refresh the page, the game state is restored.
-   **Time Adjustment Metric**: Displays a fairness ratio, indicating how much more time one player has used compared to the other. A value of `1.00` means both players have used equal time.
-   **Screen Wake Lock**: The app requests to keep the device's screen on while a timer is active, preventing the phone from sleeping mid-game.

## Tech Stack

This project is a modern, lightweight web application built with:

-   **[React](https://react.dev/)**: For building the user interface.
-   **[TypeScript](https://www.typescriptlang.org/)**: For adding static types to JavaScript, improving code quality and maintainability.
-   **[Tailwind CSS](https://tailwindcss.com/)**: For a utility-first approach to styling, enabling rapid UI development.
-   **Browser APIs**:
    -   **`localStorage`**: For persisting game state across sessions.
    -   **Screen Wake Lock API**: For preventing the screen from turning off.

## How to Use

1.  Open the app on a mobile device and place it on the table between the two players.
2.  Player 1's timer is at the bottom (right-side up). Player 2's timer is at the top (upside down).
3.  The game starts paused. The first player to take their turn taps their own side of the screen to start the opponent's clock.
4.  When your turn is over, tap your side of the screen. This will stop your clock and start your opponent's.
5.  Use the **Pause** (<svg xmlns="http://www.w3.org/2000/svg" style="display: inline-block; vertical-align: middle;" height="16" width="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>) button to pause both timers.
6.  Use the **Reset** (<svg xmlns="http://www.w3.org/2000/svg" style="display: inline-block; vertical-align: middle;" height="16" width="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h5M20 20v-5h-5M4 4l1.5 1.5A9 9 0 0120.5 15M20 20l-1.5-1.5A9 9 0 003.5 9"></path></svg>) button to set both timers back to `00:00` and clear the saved state.

## Code Overview

The entire application logic is contained within the `App.tsx` component.

### State Management (`useState` & `useRef`)

-   `player1Time`, `player2Time`: Store the elapsed time in seconds for each player.
-   `activePlayer`: Tracks whose timer is currently running (`'player1'`, `'player2'`, or `null` if paused).
-   `wakeLockRef`: A `useRef` to hold the `WakeLockSentinel` object, allowing it to persist across re-renders without triggering them.

### Side Effects (`useEffect`)

The component uses four `useEffect` hooks to manage side effects:

1.  **Load from `localStorage`**: On the initial component mount, it checks `localStorage` for a saved `scrabbleTimerState` and hydrates the timers. The app always starts in a paused state.
2.  **Save to `localStorage`**: Whenever `player1Time` or `player2Time` changes, the new times are saved to `localStorage`. This ensures the game state is never lost on a page refresh.
3.  **Timer Interval**: When `activePlayer` is set, a `setInterval` is created to increment the active player's time every second. The interval is cleared when the component unmounts or `activePlayer` changes.
4.  **Screen Wake Lock**:
    -   When a player's turn starts (`activePlayer` is not `null`), it requests a screen wake lock.
    -   When the game is paused, it releases the lock.
    -   It also includes logic to handle re-acquiring the lock if the page visibility changes (e.g., user switches tabs and comes back) to ensure the screen stays on.

### Time Adjustment Calculation

The "time adjustment" metric is a simple ratio to show the balance of time usage between players.

-   **Formula for Player 1:** `(2 * player2Time) / (player1Time + player2Time)`
-   **Formula for Player 2:** `(2 * player1Time) / (player1Time + player2Time)`

A result greater than `1.00` means your opponent has used more total time than you. A result less than `1.00` means you have used more time. An equal `1.00` means time has been split perfectly evenly.
