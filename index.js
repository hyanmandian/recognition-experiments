const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const cv = require('opencv');

const base64ToBuffer = (dataString) => {
  const matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

  return new Buffer(matches[2], 'base64');
}

app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));

io.on('connection', (socket) => {
  socket.on('process', (frame) => {
    cv.readImage(base64ToBuffer(frame), (err, img) => {
      if (err) throw err;

      img.detectObject(cv.FACE_CASCADE, {}, (err, faces) => {
        if (err) throw err;

        faces.forEach(({ x, y, width, height }) => {
          img.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, [255, 255, 0], 3);
        })

        socket.emit('frame', `data:image/gif;base64,${img.toBuffer().toString('base64')}`);
      });
    });
  });
});

http.listen(3000);
