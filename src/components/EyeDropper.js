import React, { useEffect, useState } from 'react';
import styled from 'styled-components/macro';
import { AlertDialog, Button, Col, Icon, Range, Row, ToolbarButton } from 'react-onsenui';
import CameraPhoto, { FACING_MODES } from 'jslib-html5-camera-photo';
import { TabPage } from './TabPage';
import { Colors } from '../utils/Colors';

const rectSizing = (height, width, scale) => {
  const per = scale / 100;
  const rectHeight = Math.round(height * per);
  const rectWidth = Math.round(width * per);
  const top = Math.round((height - rectHeight) / 2);
  const left = Math.round((width - rectWidth) / 2);
  return [top, left, rectHeight, rectWidth];
};

const getColorAvg = (videoElement, scale) => {
  const { videoHeight } = videoElement;
  const { videoWidth } = videoElement;
  const [top, left, rectHeight, rectWidth] = rectSizing(videoHeight, videoWidth, scale);

  // Build the canvas size and draw the image to context from videoElement
  const canvas = window.document.createElement('canvas');
  canvas.height = rectHeight;
  canvas.width = rectWidth;
  const context = canvas.getContext('2d');

  context.drawImage(videoElement, left, top, rectWidth, rectHeight, 0, 0, rectWidth, rectHeight);

  // Array with 4 numbers per pixel, flattened (RGBA)
  const imageData = context.getImageData(0, 0, rectWidth, rectHeight).data;

  let [R, G, B] = [0, 0, 0];

  for (let i = 0; i < imageData.length; i += 4) {
    R += imageData[i];
    G += imageData[i + 1];
    B += imageData[i + 2];
  }

  return [R, G, B].map(c => Math.round(c / (imageData.length / 4)));
};

const Alert = ({ text, open }) => {
  const [isOpen, setIsOpen] = useState(open);

  return (
    <AlertDialog isOpen={isOpen}>
      <div className="alert-dialog-title">Warning!</div>
      <div className="alert-dialog-content">{text}</div>
      <div className="alert-dialog-footer">
        <Button onClick={() => setIsOpen(false)} className="alert-dialog-button">
          Ok
        </Button>
      </div>
    </AlertDialog>
  );
};

const itoh = i => (Number(i).toString(16).length < 2 ? '0' : '') + Number(i).toString(16);
const rgb = array => `rgb(${array.join(',')})`;
const hex = array => `#${array.map(x => itoh(x)).join('')}`;

const EyeDropper = () => {
  const [error, setError] = useState();
  const [videoRef, setVideoRef] = useState(React.createRef());
  const [camera, setCamera] = useState();
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [scale, setScale] = useState(10);

  useEffect(() => {
    const camera = new CameraPhoto(videoRef.current);
    setCamera(camera);
  }, [videoRef]);

  useEffect(() => {
    if (cameraEnabled) {
      camera &&
        camera
          .startCamera(FACING_MODES.ENVIRONMENT, {})
          .catch(err => setError(JSON.stringify(err)));
    } else {
      camera && camera.stopCamera().catch(err => setError(JSON.stringify(err)));
    }
  }, [camera, cameraEnabled]);

  const [color, setColor] = useState([0,0,0]);
  const [colorName, setColorName] = useState('none');
  const [dataUri, setDataUri] = useState('');

  useEffect(() => {
    const id = setInterval(() => {
      if (camera && cameraEnabled) {
        const [R, G, B] = getColorAvg(videoRef.current, scale);
        setColor([R, G, B]);
        setColorName(Colors.nearestColor(R, G, B).word);
      }
    }, 1000);

    return () => clearInterval(id);
  }, [camera, cameraEnabled, scale, videoRef]);

  const videoHeight = camera && cameraEnabled ? videoRef.current.offsetHeight : 0;
  const videoWidth = camera && cameraEnabled ? videoRef.current.offsetWidth : 0;
  const [top, left, rectHeight, rectWidth] = rectSizing(videoHeight, videoWidth, scale);

  return (
    <TabPage
      label="EyeDropper"
      rightButton={
        <ToolbarButton
          icon={cameraEnabled ? 'md-videocam-off' : 'md-videocam'}
          onClick={() => setCameraEnabled(!cameraEnabled)}
        />
      }
    >
      <Col css="height: 100%">
        <Row>
          <div
            css={`
              position: relative;
              height: 100%;
              ${!cameraEnabled ? 'display: none;' : ''}

              &::before {
                content: ${'""'};
                position: absolute;
                top: ${top}px;
                left: ${left}px;
                height: ${rectHeight}px;
                width: ${rectWidth}px;
                outline: ${cameraEnabled ? 5 : 0}px solid ${rgb(color)};
                background: rgba(0, 0, 0, 0);
                z-index: 1;
              }
            `}
          >
            <video css="max-width: 100%" ref={videoRef} autoPlay="true" />
          </div>
        </Row>
        {cameraEnabled ? (
          <>
            <Row>
              <Col width="40px" css="text-align: center; line-height: 31px;">
                <Icon size={14} icon="md-crop-square" />
              </Col>
              <Col>
                <Range
                  css="width: 100%"
                  value={scale}
                  onChange={event => setScale(parseInt(event.target.value))}
                />
              </Col>
              <Col width="40px" css="text-align: center; line-height: 31px;">
                <Icon size={26} icon="md-crop-square" />
              </Col>
            </Row>
            <Row css="margin-bottom: 0.5em">
              <div
                css={`
                  display: grid;
                  grid-template: repeat(2, 1fr) / 4em 1.5em 1fr;
                `}
              >
                <div>Average:</div>
                <div
                  css={`
                    width: 1em;
                    height: 1em;
                    margin: 0 0.3em;
                    background: ${rgb(color)};
                  `}
                />
                <div>{hex(color)}</div>
                <div>Closest:</div>
                <div
                  css={`
                    width: 1em;
                    height: 1em;
                    margin: 0 0.3em;
                    background: ${rgb(Colors.getCss(colorName))};
                  `}
                />
                <div>{`${hex(Colors.getCss(colorName))} ${colorName} `}</div>
              </div>
            </Row>
          </>
        ) : (
          <Row>
            <p>Camera disabled. Enable to estimate colors.</p>
          </Row>
        )}
      </Col>
      <Alert text={error} open={!!error} />
    </TabPage>
  );
};

export { EyeDropper };
