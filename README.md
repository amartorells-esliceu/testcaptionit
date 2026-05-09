# CaptionIt

A real-time multiplayer game where creativity and humor are the keys to victory. Players join a room using a code and compete by answering absurd prompts or adding captions to random memes. Through a blind voting system, players choose the funniest response, accumulating points to determine the winner of the game.

## Installation Instructions

### Prerequisites

...

### Environment Variables

...

### Commands to Start

...

### Access

...

## Relational Model Diagram

..

## Functional Requirements

* **R01. Rooms and Hosts:** Any user can create a room and become the "Host," receiving a unique 4-character access code.
* **R02. Joining the Game:** Players join using the code and a nickname. The system uses Local Storage or Cookies to allow reconnection.
* **R03. Configuration:** The Host chooses the game mode (Phrases/Images), number of rounds, response time (e.g., 60s), and player limit.
* **R04. Mode 1 (Questions):** The system displays an open-ended question and players submit anonymous answers.
* **R05. Mode 2 (Images):** A random meme or image is shown, and players must write a funny caption for it.
* **R06. Blind Voting:** Responses are shuffled to hide authorship. Players are not allowed to vote for their own submission.
* **R07. Points System:** Points are awarded for each vote received. A "United People" bonus is given if more than 80% of the room votes for the same answer.
* **R08. Real-Time Ranking:** Animated bar charts are shown after each round displaying current positions.
* **R09. End of Game:** A podium featuring the top 3 players and statistics (e.g., "Most Voted") is displayed.
* **R10. Automatic Deletion:** A cron job or timer deletes inactive rooms to optimize server resources.