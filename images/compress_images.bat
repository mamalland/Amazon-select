@echo off
chcp 936 >nul
setlocal EnableDelayedExpansion

REM Target size: 100KB = 102400 bytes
set "TARGET_SIZE=102400"

REM Create log file
set "logFile=compress_log.txt"
echo ========================================== > "%logFile%"
echo  Image Compress Tool >> "%logFile%"
echo  Compress to 100KB, Crop to 1:1 >> "%logFile%"
echo  Start: %date% %time% >> "%logFile%"
echo ========================================== >> "%logFile%"
echo. >> "%logFile%"

echo ==========================================
echo  Image Compress Tool
echo  Compress to 100KB, Crop to 1:1
echo ==========================================
echo.

REM Check ImageMagick
where magick >nul 2>nul
if %errorlevel% neq 0 (
    echo [Error] ImageMagick not found!
    echo [Error] ImageMagick not found! >> "%logFile%"
    echo Download: https://imagemagick.org/script/download.php#windows
    echo.
    pause
    exit /b 1
)

echo [Info] ImageMagick found
echo [Info] ImageMagick found >> "%logFile%"
echo.

set "processed=0"
set "skipped=0"
set "failed=0"

echo [Debug] Current folder: %cd% >> "%logFile%"

REM Create a list of unique image files (only lowercase extensions to avoid duplicates)
set "fileCount=0"
for %%f in (*.jpg *.jpeg *.png) do (
    set /a fileCount+=1
    set "file!fileCount!=%%f"
)

echo [Info] Found %fileCount% image files
echo [Info] Found %fileCount% image files >> "%logFile%"
echo.

if %fileCount%==0 (
    echo [Warning] No image files found in current folder
    echo [Warning] No image files found in current folder >> "%logFile%"
    goto :end
)

REM Process each file
set "i=0"
:loop
set /a i+=1
if %i% GTR %fileCount% goto :end

set "currentFile=!file%i%!"
echo.
echo [Process] !currentFile!
echo [Process] !currentFile! >> "%logFile%"

REM Check if file exists and is accessible
if not exist "!currentFile!" (
    echo [Error] File not found or not accessible: !currentFile!
    echo [Error] File not found or not accessible: !currentFile! >> "%logFile%"
    set /a failed+=1
    goto :loop
)

REM Try to get file size with error handling
set "filesize="
for %%a in ("!currentFile!") do set "filesize=%%~za"

if "!filesize!"=="" (
    echo [Error] Cannot read file size for !currentFile! ^(file may be locked by another process^)
    echo [Error] Cannot read file size for !currentFile! ^(file may be locked by another process^) >> "%logFile%"
    set /a failed+=1
    goto :loop
)

echo [Debug] File size: !filesize! bytes >> "%logFile%"

REM Get image dimensions using magick identify
set "dimFile=dim_temp.txt"
if exist "!dimFile!" del "!dimFile!" 2>nul

magick identify -format "w=%%w\nh=%%h\n" "!currentFile!" > "!dimFile!" 2>nul

if not exist "!dimFile!" (
    echo [Error] Cannot get image dimensions for !currentFile!
    echo [Error] Cannot get image dimensions for !currentFile! >> "%logFile%"
    set /a failed+=1
    goto :loop
)

REM Parse dimensions from temp file
set "width="
set "height="
for /f "tokens=1,2 delims==" %%a in (!dimFile!) do (
    if "%%a"=="w" set "width=%%b"
    if "%%a"=="h" set "height=%%b"
)

REM Clean up temp file
del "!dimFile!" 2>nul

REM Check if dimensions were obtained
if "!width!"=="" (
    echo [Error] Cannot get image width for !currentFile!
    echo [Error] Cannot get image width for !currentFile! >> "%logFile%"
    set /a failed+=1
    goto :loop
)

if "!height!"=="" (
    echo [Error] Cannot get image height for !currentFile!
    echo [Error] Cannot get image height for !currentFile! >> "%logFile%"
    set /a failed+=1
    goto :loop
)

echo [Debug] Dimensions: !width!x!height! >> "%logFile%"

REM Check if 1:1 ratio
set "isSquare=0"
if "!width!"=="!height!" set "isSquare=1"

REM Check if less than target size (100KB = 102400 bytes)
set "isSmallEnough=0"
if !filesize! LSS %TARGET_SIZE% set "isSmallEnough=1"

echo [Debug] isSquare=!isSquare!, isSmallEnough=!isSmallEnough! >> "%logFile%"

REM Skip if already meets requirements
if "!isSquare!"=="1" if "!isSmallEnough!"=="1" (
    echo [Skip] !currentFile! already meets requirements ^(!filesize! bytes^)
    echo [Skip] !currentFile! already meets requirements ^(!filesize! bytes^) >> "%logFile%"
    set /a skipped+=1
    goto :loop
)

echo [Info] Size: !width!x!height!, File: !filesize! bytes
echo [Info] Size: !width!x!height!, File: !filesize! bytes >> "%logFile%"

REM Create temp filenames using simple naming
set "tempFile=temp_%i%.jpg"
set "backupFile=backup_%i%.tmp"

REM Remove any existing temp files
if exist "!tempFile!" del "!tempFile!" 2>nul
if exist "!backupFile!" del "!backupFile!" 2>nul

REM Backup original
copy "!currentFile!" "!backupFile!" >nul 2>nul
if errorlevel 1 (
    echo [Error] Cannot backup !currentFile!
    echo [Error] Cannot backup !currentFile! >> "%logFile%"
    set /a failed+=1
    goto :loop
)

REM Calculate crop size (use smaller dimension)
set "cropSize=!width!"
if !height! LSS !width! set "cropSize=!height!"

echo [Action] Crop to !cropSize!x!cropSize! and compress to JPG...
echo [Action] Crop to !cropSize!x!cropSize! and compress to JPG... >> "%logFile%"

REM Calculate target dimensions for resizing (max 800px to help reduce file size)
set "targetDim=!cropSize!"
if !cropSize! GTR 800 set "targetDim=800"

echo [Info] Resizing to !targetDim!x!targetDim! to help reduce file size
echo [Info] Resizing to !targetDim!x!targetDim! to help reduce file size >> "%logFile%"

REM Crop to square, resize to max 800px, and compress as JPG (quality 85)
REM Using jpg format to ensure compression works
magick "!currentFile!" -gravity center -crop !cropSize!x!cropSize!+0+0 +repage -resize !targetDim!x!targetDim! -strip -interlace Plane -quality 85 "!tempFile!" 2>nul

if errorlevel 1 (
    echo [Error] Failed to process !currentFile!
    echo [Error] Failed to process !currentFile!, errorlevel=!errorlevel! >> "%logFile%"
    set /a failed+=1
    if exist "!tempFile!" del "!tempFile!" 2>nul
    if exist "!backupFile!" del "!backupFile!" 2>nul
    goto :loop
)

REM Check if temp file was created
if not exist "!tempFile!" (
    echo [Error] Temp file not created for !currentFile!
    echo [Error] Temp file not created for !currentFile! >> "%logFile%"
    set /a failed+=1
    if exist "!backupFile!" del "!backupFile!" 2>nul
    goto :loop
)

REM Check if still larger than target size
for %%b in ("!tempFile!") do set "newSize=%%~zb"
echo [Debug] After first compress: !newSize! bytes >> "%logFile%"

if !newSize! GTR %TARGET_SIZE% (
    echo [Info] Still larger than 100KB, compressing more...
    echo [Info] Still larger than 100KB, compressing more... >> "%logFile%"
    
    REM Try different quality levels (from 80 down to 20) and smaller sizes
    for %%q in (80 75 70 65 60 55 50 45 40 35 30 25 20) do (
        magick "!currentFile!" -gravity center -crop !cropSize!x!cropSize!+0+0 +repage -resize !targetDim!x!targetDim! -strip -interlace Plane -quality %%q "!tempFile!" 2>nul
        for %%c in ("!tempFile!") do set "newSize=%%~zc"
        echo [Debug] Quality %%q: !newSize! bytes >> "%logFile%"
        if !newSize! LEQ %TARGET_SIZE% (
            echo [Info] Quality %%q OK, Size: !newSize! bytes
            echo [Info] Quality %%q OK, Size: !newSize! bytes >> "%logFile%"
            goto :compressionDone
        )
    )
    
    REM If still too large, try reducing dimensions
    echo [Info] Trying to reduce dimensions further...
    echo [Info] Trying to reduce dimensions further... >> "%logFile%"
    
    for %%s in (600 500 400 300) do (
        magick "!currentFile!" -gravity center -crop !cropSize!x!cropSize!+0+0 +repage -resize %%sx%%s -strip -interlace Plane -quality 85 "!tempFile!" 2>nul
        for %%c in ("!tempFile!") do set "newSize=%%~zc"
        echo [Debug] Size %%sx%%s: !newSize! bytes >> "%logFile%"
        if !newSize! LEQ %TARGET_SIZE% (
            echo [Info] Size %%sx%%s OK, Size: !newSize! bytes
            echo [Info] Size %%sx%%s OK, Size: !newSize! bytes >> "%logFile%"
            goto :compressionDone
        )
    )
)

:compressionDone

REM Check final size
for %%d in ("!tempFile!") do set "finalSize=%%~zd"
echo [Debug] Final size: !finalSize! bytes >> "%logFile%"

if !finalSize! LEQ %TARGET_SIZE% (
    REM Get original extension
    set "origExt=!currentFile:~-4!"
    
    REM If original was jpg/jpeg, replace directly; if png, change to jpg
    if /I "!origExt!"==".png" (
        set "newFileName=!currentFile:~0,-4!.jpg"
        move /y "!tempFile!" "!newFileName!" >nul 2>nul
        if errorlevel 1 (
            echo [Error] Cannot create !newFileName!
            echo [Error] Cannot create !newFileName! >> "%logFile%"
            move /y "!backupFile!" "!currentFile!" >nul 2>nul
            set /a failed+=1
        ) else (
            REM Delete original PNG file
            del "!currentFile!" 2>nul
            echo [Success] !currentFile! -^> !newFileName!, Final: !finalSize! bytes
            echo [Success] !currentFile! -^> !newFileName!, Final: !finalSize! bytes >> "%logFile%"
            set /a processed+=1
        )
    ) else (
        REM Replace original (jpg/jpeg)
        move /y "!tempFile!" "!currentFile!" >nul 2>nul
        if errorlevel 1 (
            echo [Error] Cannot replace original file !currentFile!
            echo [Error] Cannot replace original file !currentFile! >> "%logFile%"
            move /y "!backupFile!" "!currentFile!" >nul 2>nul
            set /a failed+=1
        ) else (
            echo [Success] !currentFile! done, Final: !finalSize! bytes
            echo [Success] !currentFile! done, Final: !finalSize! bytes >> "%logFile%"
            set /a processed+=1
        )
    )
) else (
    echo [Warning] Cannot compress !currentFile! below 100KB ^(!finalSize! bytes^)
    echo [Warning] Cannot compress !currentFile! below 100KB ^(!finalSize! bytes^) >> "%logFile%"
    move /y "!backupFile!" "!currentFile!" >nul 2>nul
    if exist "!tempFile!" del "!tempFile!" 2>nul
    set /a failed+=1
)

REM Cleanup
if exist "!backupFile!" del "!backupFile!" 2>nul

goto :loop

:end
echo.
echo ==========================================
echo  Done!
echo  Success: %processed% files
echo  Skipped: %skipped% files (already OK)
echo  Failed: %failed% files
echo ==========================================
echo.

echo. >> "%logFile%"
echo ========================================== >> "%logFile%"
echo  Done! >> "%logFile%"
echo  Success: %processed% files >> "%logFile%"
echo  Skipped: %skipped% files (already OK) >> "%logFile%"
echo  Failed: %failed% files >> "%logFile%"
echo  End: %date% %time% >> "%logFile%"
echo ========================================== >> "%logFile%"

pause
