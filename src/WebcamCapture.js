import React, { useRef, useEffect, useState } from 'react';
import Tesseract from 'tesseract.js';
import Button from '@mui/material/Button';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import './App.css';

const WebcamCapture = () => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const [userDetails, setUserDetails] = useState({
        fullName: '',
        address: '',
        issuanceDate: '',
        expirationDate: '',
    });

    useEffect(() => {
        const getMedia = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                }
            } catch (err) {
                console.error("Error: ", err);
                alert("Camera access was denied. Please allow camera access to use this feature.");
            }
        };

        getMedia();

        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                const tracks = videoRef.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            }
        };
    }, []);

    const preprocessImage = (canvas) => {
        const context = canvas.getContext('2d');
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        // for (let i = 0; i < imageData.data.length; i += 4) {
        //     const avg = (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;
        //     imageData.data[i] = avg; // Red
        //     imageData.data[i + 1] = avg; // Green
        //     imageData.data[i + 2] = avg; // Blue
        // }
        context.putImageData(imageData, 0, 0);
    };

    const captureImage = () => {
        if (canvasRef.current && videoRef.current) {
            preprocessImage(canvasRef.current); // Now calling preprocessImage here
            setTimeout(() => { // Add a slight delay to ensure canvas is ready
                const imageData = canvasRef.current.toDataURL('image/jpeg');
                setCapturedImage(imageData);
                recognizeText(imageData);
            }, 500);
        } else {
            console.error("Canvas element is not available.");
        }
    };


    const recognizeText = (imageData) => {
        Tesseract.recognize(
            imageData,
            'eng',
            { 
                logger: m => console.log(m),
                tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
                tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY,
                tessedit_pageseg_mode: Tesseract.PSM.SINGLE_LINE
            }
        ).then(({ data: { text } }) => {
            console.log('OCR Text:', text); // Log OCR text for debugging
            const cleanedText = text.replace(/[^a-zA-Z0-9 .]/g, '');
            const details = parseDriverLicense(cleanedText);
            setUserDetails(prevState => ({ ...prevState, ...details })); // Update using prevState for safety
        });
    };

    const parseDriverLicense = (text) => {
        // Custom regex patterns based on the expected OCR output
        const fullNamePattern = /1\.\s*([^\n\r]*)/;
        const addressPattern = /8\.\s*([^\n\r]*)/;
        const issueDatePattern = /4a\. Iss:\s*([^\n\r]*)/;
        const expDatePattern = /4b\. Exp:\s*([^\n\r]*)/;
  
        const fullNameMatch = text.match(fullNamePattern);
        const addressMatch = text.match(addressPattern);
        const issuanceDateMatch = text.match(issueDatePattern);
        const expirationDateMatch = text.match(expDatePattern);
  
        return {
            fullName: fullNameMatch ? fullNameMatch[1].trim() : '',
            address: addressMatch ? addressMatch[1].trim() : '',
            issuanceDate: issuanceDateMatch ? issuanceDateMatch[1].trim() : '',
            expirationDate: expirationDateMatch ? expirationDateMatch[1].trim() : '',
        };
    };

    return (
        <div className="app-container">
            <header className="app-header">
                <h1>License Reader App</h1>
            </header>
            <div className="capture-area">
                <video ref={videoRef} style={{ display: capturedImage ? 'none' : 'block' }} autoPlay muted playsInline />
                <Button variant="contained" color="primary" onClick={captureImage} startIcon={<CameraAltIcon />}>
                    Capture
                </Button>
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                {capturedImage && (
                    <img
                        src={capturedImage}
                        alt="Captured"
                        style={{ maxWidth: '100%', maxHeight: '400px', marginTop: '20px' }}
                    />
                )}
            </div>
            <div className="user-details-form">
                <h3>User Details</h3>
                <form>
                    <div className="form-group">
                        <label htmlFor="fullName">Full Name:</label>
                        <input type="text" id="fullName" value={userDetails.fullName} readOnly autoComplete="on" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="address">Address:</label>
                        <input type="text" id="address" value={userDetails.address} readOnly autoComplete="on" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="issuanceDate">DL Issuance Date:</label> 
                        <input type="text" id="issuanceDate" value={userDetails.issuanceDate} readOnly autoComplete="on" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="expirationDate">DL Expiration Date:</label>
                        <input type="text" id="expirationDate" value={userDetails.expirationDate} readOnly autoComplete="on" />
                    </div>
                </form>
            </div>
        </div>
    );
};

export default WebcamCapture;