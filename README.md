# After-Playlist
> Tired of switching between After Effects and Spotify? After Playlist is a script UI panel in AE that lets you perform media controls directly inside AE!

## The Problem It Solves
Many editors have a state they reach called the **flow state,** a time where editors are completely focus on what they are making resulting in higher efficiency. One of the major contributors to this state is music. Music allows people to relax and forget about their surrounding. 

After Playlist is an After Effects Script UI Panel that embeds media controls directly in After Effects so you don't need to leave that important flowstate.

## Features and Quality of Life (QoL) Improvements
1. Compact UI with standard unicode media icon so it isn't an eyesore to look at :D
2. Play, Pause, and skip forward and backward! No need to play songs you don't want to listen to.
3. Very easy to run! No need for spotify API keys or weird software. All you need is the script!
4. Resizable buttons to a certain length so no need to worry about the buttons cutting off when you resize the window. (v2.1.0+)
5. Startup Diagnostics test: Don't know if the script can run? Don't know why it wont work? Run the diagnostics test to find out! (v2.1.0+)
6. Now features a "Now Playing" at the top that shows the artist name and song name! (v3.0.0+)

##  Installation
1. Open **After Effects**.
2. Enable script permissions:
   * Go to **Edit > Preferences > Scripting & Expressions**.
   * Check **"Allow Scripts to Write Files and Access Network"**.
   * Click **OK**.
3. Close After Effects
4. Download or copy `KeyframeMyVibe.jsx`.
5. Place the `.jsx` file into your ScriptUI Panels directory:
   ```text
   C:\Program Files\Adobe\Adobe After Effects <Version>\Support Files\Scripts\ScriptUI Panels\
6. Open After Effects:
   * Go to Window at the top.
   * Click the After Playlist file (May need to scroll down)
   * Begin using it!

    'Note:' This script only works with the desktop version of Spotify and other possible supported apps. It also takes a while for it to run after pressing the button so please have patience! 

## Challenges
Honestly the biggest challenge was figuring out how to make it work. ExtendScript doesn't natively support asynchronous Windows APIs so I had to learn to build a simple Powershell bridge to run windows commands.

## Extra Info
Language: ExtendScript ( Javascript / JSX )
Framwork: Adobe ScriptUI
Backend: Windows Powershell/System Commands

## Licence
Distributed under the MIT License. See LICENSE for details.