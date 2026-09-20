# After Playlist v4.2.0 - User Manual

## What does After Playlist do?
After Playlist is an Adobe After Effects ScriptUI panel that lets you control Windows 11 playback WITHOUT leaving After Effects. It sends system media commands for various tasks. It can launch Spotify and display what is currently playing through the Windows media-session system. Lastly, it has a simple settings menu for changing polling intervals, starting in compact mode, and other features.

## Installation

Install and copy the latest release to ```C:\Program Files\Adobe\Adobe After Effects <Version>\Support Files\Scripts\ScriptUI Panels\```
Make sure After Effects is not currently running when you add the file to the directory mentioned above. The script should be visible in the "Windows" menu on the top of After Effects.

## Main controls

◈ - Launches Spotify

▢ - Toggles compact mode

⚙ - Launches settings menu

◀◀ - Previous track

▶ Ⅱ - Play/Pause

▶▶ - Next track

− - Volume down

✕ - Mute

+ - Volume up

DIAGNOSTICS - Runs diagnostics test

## Now-playing display
Now this is my favorite part. I'm very happy I got it to work. Basically it's a hero card that displays the playback state and what's playing. READY means it's running and waiting for the first media check. FETCHING means the script is requesting Windows for the current track. NOW PLAYING shows the title and artist. NOT PLAYING means Windows did not report any active track. And lastly, ERROR means the request either failed or timed out.

## Compact Mode
I felt I needed to include this because it may need some clarification. Compact mode hides everything except the play/pause, next track, previous track, and the top three buttons. I will not top the polling or disable the media commands all it does is change the visible layout.

## Recommended workflow
Open After Playlist while using After Effects. Start any music player (preferably Spotify) and use the playback controls without ever having to switch applications! Use the DIAGNOSTICS button if the media controls do not respond. It's recommended to dock the panel somewhere to make sure it doesn't remain floating.

### Requirements
- Windows
- PowerShell
- Windows Media Keys
- After Effects 2025 (Other versions may work but may not provide the same stability)
- An active media player (preferably Spotify)
