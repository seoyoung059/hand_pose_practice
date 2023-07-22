
const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');



function onResults(results) {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(
      results.image, 0, 0, canvasElement.width, canvasElement.height);

  let boxLocation = {leftX: 0.1, topY: 0.1, lenX:0.3, lenY: 0.3};
  const w = canvasCtx.canvas.width;
  const h = canvasCtx.canvas.height;

  canvasCtx.strokeStyle='green';
  canvasCtx.strokeRect(boxLocation.leftX * w, boxLocation.topY*h, boxLocation.lenX*w, boxLocation.lenY*h);


  let pick=false;
  let onObj=false;
  if (results.multiHandLandmarks) {
    for (const landmarks of results.multiHandLandmarks) {
      // drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS,
      //                {color: '#00FF00', lineWidth: 5});
      // console.log(landmarks[4], landmarks[8]);
      let {distance, fingerPick} = fingerDistance(landmarks);
      pick = (distance < 0.01)?true:false;
      onObj=objToPick(boxLocation, fingerPick,canvasCtx);
      let color = (pick&&onObj)?'#FF0000':'#00FF00';
      drawLandmarks(canvasCtx, landmarks, {color: color, lineWidth: 2});
      
    }
  }

  // canvasCtx.strokeStyle = (onObj&&pick) ? 'red':'green';
  console.log('pick: ',pick, 'onObj', onObj);
  canvasCtx.restore();
}

function objToPick(location, fingerPick, ctx) {
  const {leftX: objLeftX, topY: objTopY, lenX:objXLength, lenY: objYLength} = location;
  const {x: fingerX, y: fingerY, z:_} = fingerPick;
  
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  // console.log(objLeftX, fingerX, (objLeftX+objXLength));
  // console.log(objTopY, fingerY, objTopY+objYLength);
  if (objLeftX < fingerX && fingerX< (objLeftX+objXLength) && objTopY < fingerY && fingerY< objTopY+objYLength){
    return true;
  }
  else { return false;}
}

function fingerDistance(landmarks){
  // 손 크기 기준 좌표
  const {x:zeroX, y:zeroY, z:zeroZ} = landmarks[0];
  const {x:fifthX, y:fifthY, z:fifthZ} = landmarks[5];
  const {x:lastX, y:lastY, z:lastZ} = landmarks[17];
  // 엄지와 검지 끝 좌표
  const {x:umziX, y:umziY, z:umziZ} = landmarks[4];
  const {x:gumziX, y:gumziY, z:gumziZ} = landmarks[8];
  // 거리 계산
  const base = ((fifthX-zeroX)**2 +(fifthY-zeroY)**2 +(fifthZ-zeroZ)**2
      + (fifthX-lastX)**2 +(fifthY-lastY)**2 +(fifthZ-lastZ)**2
      + (lastX-zeroX)**2 +(lastY-zeroY)**2 +(lastZ-zeroZ)**2)**0.5;
  const distance = (umziX-gumziX)**2 +(umziY-gumziY)**2 +(umziZ-gumziZ)**2;
  return {distance: distance/base, fingerPick:{x:(umziX+gumziX)/2, y:(umziY+gumziY)/2}};
}

const hands = new Hands({locateFile: (file) => {
  return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
}});
hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});
hands.onResults(onResults);

const camera = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({image: videoElement});
  },
  width: 1280,
  height: 720
});
camera.start();