# After Playlist 5.0.0 - Troubleshooting Manual

This guide applies to the new and final version 5.0.0 of After Playlist for Adobe After Effects.

Error codes have been added in the latest version.
Here are all error codes (fixes lister later in the manual):

E101 - Required Windows system file is missing.
E102 - Diagnostic check failed.
E201 - Media-key command failed.
E301 - Spotify launch failed.
E401 - Windows media session query returned an error.
E402 - Now-playing request timed out.
E403 - After Effect couldn't read or process the now-playing result.

# General fixes (Try these first!)

Before deciding to troubleshoot a specific error, perform these fixes in order. First close any duplicate panels of After Playlist (even if they are different versions). Then close and reopen the panel so any old temporary request state is cleared. If that does not help, restart After Effects.

Please confirm that the script is running on Windows (11 is prefered), the file has a ```jsx``` extension, and that it was placed in the correct ScriptUI Panels folder. Make sure After Effects has access to networks and can run scripts and write temporary files. The script uses the Windows temporary folder for mostly all actions.

Open a media player and start a track before testing any feature. Wait atleast 1 second before clicking another button to prevent repeated media commands.

Lastly, run the ```Check``` button before making any more changes. It will report whats wrong and will provide specific error codes for which the fixes are listed below.

## Error code fixes

### E101 - System files are missing
Where it occurs: The ```Check``` button verifies the expected Powershell and Windows Script Host files.

Possible causes: Powershell is disabled or entirely removed, Windows Script Host is unavailable, or the operating system isn't Windows.

Fix: Please confirm that these files exist on your device:
```C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe```
```C:\Windows\System32\wscript.exe```

If the files do not exist, use a supported and legit Windows installation or ask the system admin to restore the missing components. Please do not use unverified or third party bypasses to make it work. After the files are existant, please restart After Effects and run ```Check``` again.

### E102 - Diagnostics failed
Where it occurs: The diagnostic routine encounters and unexpected exception when it checks the system files. 

Possible causes: It is a permission issue, an unusual Windows environment, and damaged file, or an After Effects scripting exception.

Fix: Restart After Effects, confirm that scripting is enabled, and run the ```Check``` button again. If the issue persists, record the exact text stated after ```E102```, the Windows version, and AE version. Keep the original script backup because the failure is not an issue with the media command itself.

### E201 - Media command failed
Where it occurs: One of the media commands cannot be started.

Possible causes: PowerShell or Windows Script Host is unavailable, AE cannot write to the temporary folder, a security tool blocks the process, or the helper command couldn't be launched.

Fix: First run ```Check```. Confirm that the Windows temp foler is writable and the AE scripting preference allows file writing. Temporarily disable any antivirus or endpoint-security software to check if thats whats causing it. Test with a media player that's already open. The issue may be related to the compatibility of the player.

### E301 - Spotify launch failed
Where it occurs: The Spotify launcher button cannot launch the ```spotify:``` protocol.

Possible causes: Spotify is not installed, the protocol isn't registered, Windows doesn't have a default handler for the protocol, or the helper process couldn't start. 

Fix: Open Spotify manually and confirm that it is installed for the current Windows user. Run ```Check``` to verify the PowerShell and Windows Script Host. If Spotify is installed but the button is not working, reinstall Spotify with the latest version and with the ```spotify:``` protocol registered.

### E401 - Media session error
Where it occurs: The PowerShell media session request writes "ERROR" to the result file.

Possible causes: No supported Windows media session available, the media player does not expose metadata through the Windows Session API, or Windows runtime failed.

Fix: Start a track in a supported media player, wait a few seconds, and allow the next polling cycle to run. Close and reopen the track. Reopen After Playlist. If the playback controls work but the metadata remains unavailable, the player may support media keys without showing the artist and title metadata throught the Windows session API.

### E402 - Now playing request timed out
Where it occurs: The panel requested info on whats playing, but the temporary file wasn't created fast enough.

Possible causes: PowerShell took too long to start, the media session request stalled, a security tool blocked the process, the temporary folder is unavailable, or the player didn't respond.

Fix: Wait for the next scheduled attempt, or close and reopen the panel. Run the ```Check``` button and confirm that the temporary directory is writable, and allow PowerShell and Windows Script Host through security software if comfortable and appropriate. Start a track before reoping the panel. Avoid having multiple panels upen.

### E403 - Now playing read error
Where it occurs: AE finds the result file but can't read or process it.

Possible causes: The result file locked, malformed, inaccessible, or removed before it could be read.

Fix: Close and reopen After Playlist to clear the temporary request. If the issue persists, close AE and remove only the stale ```afterplaylist_np.txt``` files from the Windows temporary folder. Do not delete any files while a request is actively running. Check that security software is not quarantining the temporary result file.

## General problems without an error code

### The panel does not appear
Confirm the filename ends in ```.jsx```, place it in the ScriptUI Panels folder, restart AE, and open it from the window menu (May need to scroll down). Please review scripting permissions.

### Status text is cutoff/difficult to read
Use the newest, fixed JSX version, which has the status text on it's own row at the bottom. You may need to widen the panel if its too thin. Also make sure you are not using compact mode as it hides the footer.

### The button sends a command but the playback controls don't do anything
Confirm the player is active and preferable Spotify. Wait slighlty between clicks. Play/Pause is a toggle and depends on the player's current state. 

### The player becomes very slow
Make sure no duplicate panels are open and please reference to the minimum system requirements located near the end of the README. Also close any unecessary processes that may be using too much ram.

## Reporting a problem
**Send any problems to "pie.vfx" on Slack.**

Include the error code, complete tooltip, Windows version, After Effects versiom, the media player, and what's involved (button, state, etc). Here is what a useful report looks like:

```Code: E402```
```Windows: Windows 11```
```After Effects: [version]```
```Player: Spotify```
```Steps: Open panel, start Spotify, wait for fetching```
```Result: E402 Now playing request timed out```
```Repeated: Yes, after reopening the panel```

## Known limitations of After Playlist
This version is specifically designed for Windows. It depends on PowerShell, Windows Script Host, Windows media keys, the Windows media-session API, and a writable temporary folder. It is NOT indended to run during an AE render. It's command-based so it cant guarantee the exact state of every player after a command.
