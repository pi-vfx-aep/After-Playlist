# After-Playlist
> Tired of switching between After Effects and Spotify? After Playlist is a script UI panel in AE that lets you perform media controls directly inside AE!

DEMO:

https://github.com/user-attachments/assets/9ad80a17-95d3-4de7-aea7-a30cf1d47db0

## The Problem It Solves
Many editors have a state they reach called the **flow state,** a time where editors are completely focus on what they are making resulting in higher efficiency. One of the major contributors to this state is music. Music allows people to relax and forget about their surrounding. 

After Playlist is an After Effects Script UI Panel that embeds media controls directly in After Effects so you don't need to leave that important flowstate.

## Features and Quality of Life (QoL) Improvements
1. Compact UI with standard unicode media icon so it isn't an eyesore to look at :D
2. Play, Pause, and skip forward and backward! No need to play songs you don't want to listen to.
3. Resizable buttons to a certain length so no need to worry about the buttons cutting off when you resize the window. (v2.1.0+)
4. Startup Diagnostics test: Don't know if the script can run? Don't know why it wont work? Run the diagnostics test to find out! (v2.1.0+)
5. Now features a "Now Playing" at the top that shows the artist name and song name! (v3.0.0+)
6. New compact mode and launch spotify buttons! (v4.0.0+)
7. Added new settings menu! (v5.0.0+)


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


## Challenges
Honestly the biggest challenge was figuring out how to make it work. ExtendScript doesn't natively support asynchronous Windows APIs so I had to learn to build a simple Powershell bridge to run windows commands.
Another challenge was trying to constantly add new features or UI updates WITHOUT breaking the functionality of the script.

## AI disclaimer
I will admit to using AI for generating some ideas, help with some specific things like how to use the temporary folder in Windows. I used Gemini in the beginning to tell me what I should add because I was having a hard time coming up with what to add since it felt a bit empty up until now. I copy and pasted a few time for unicode symbols, windows directories, and I will admit, though it was a bad mistake, I did copy paste a version from AI that fixed all my missing semicolons. I'm sorry :(

## Useful sources that helped me
I always use VS Code on only half my screen as the other half has spotify (gotta listen to music :D) and any source that I need like a Youtube tutorial, a forum, or documentation. Here's a couple sources I used:
- https://helpx.adobe.com/after-effects/desktop/automate-in-after-effects/automate-animation/scripts.html
- https://ae-scripting.docsforadobe.dev/
- https://learn.microsoft.com/en-us/uwp/api/windows.media.control.globalsystemmediatransportcontrolssessionmanager?view=winrt-28000
- https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.management/start-process
- https://developer.spotify.com/documentation/web-api/concepts/spotify-uris-ids

I truly hope someone finds these sources useful if they ever intend on making something similar to this silly little project of mine.

## Extra Info
Language: ExtendScript ( Javascript / JSX )
Framwork: Adobe ScriptUI
Backend: Windows Powershell/System Commands

## Licence
Distributed under the MIT License. See LICENSE for details.
