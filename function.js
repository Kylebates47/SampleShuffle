function basename(url) {
    return url.split('/').reverse()[0];
  }
  
  function dirname(url) {
    let path = url.split('/');
    path.pop();
  
    return path.join('/') + '/';
  }
  
  class Sound {
    constructor(url, context, callback) {
      this.url = url;
      this.context = context;
      this.buffer = null;
      this.loop = false;
      this.volume = 5;
      this.pitch = 50;
      this.refCount = 0;
      this.ready = false;
      this.onReady = callback;
  
      $("#sounds").append(
      $("<li>").attr("id", basename(this.url).replace(".", "_")).text(basename(this.url)).append(
      $("<span>").attr("class", "playstate").html("<i class='fa fa-volume-off'></i>")));
  
  
      this.onPlay = () => {$("#" + basename(this.url).replace(".", "_")).find(".playstate").html("<i class='fa fa-volume-up'></i>");};
      this.onEnd = () => {$("#" + basename(this.url).replace(".", "_")).find(".playstate").html("<i class='fa fa-volume-off'></i>");};
  
      this.load(url);
    }
  
    onLoad() {
      this.ready = true;
      if (this.onReady) this.onReady(this);
    }
  
    play(time) {
      if (this.ready) {
        var sourceNode = this.context.createBufferSource();
        sourceNode.buffer = this.buffer;
        sourceNode.playbackRate.value = this.pitch;
        sourceNode.loop = this.loop;
        sourceNode.onended = this.onEnd;
  
        var gainNode = this.context.createGain();
        gainNode.gain.value = this.volume;
  
        sourceNode.connect(gainNode);
        gainNode.connect(this.context.destination);
  
        if (typeof this.onPlay === "function") this.onPlay();
        sourceNode.start(0);
      } else {
        console.warn("Attempted to play audio before loading...");
      }
    }
  
    load(url) {
      var request = new XMLHttpRequest();
      request.open("GET", url, true);
      request.responseType = "arraybuffer";
  
      var _this = this;
  
      request.onload = function () {
        _this.context.decodeAudioData(
        request.response,
        function (buffer) {
          if (!buffer) {
            alert("Failed to decode " + url + ": Received no data!");
            return;
          }
  
          _this.buffer = buffer;
          _this.onLoad();
        },
        function (error) {
          console.error("decodeAudioData Error:", error);
        });
  
      };
  
      request.onerror = function () {
        console.warn("Failed to load " + url + ": XHR error!");
      };
  
      request.send();
    }}
  
  
  class AudioManager {
    constructor() {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
      this.sounds = {};
    }
  
    load(url, callback) {
      this.sounds[url] = new Sound(url, this.context, callback);
      return this.sounds[url];
    }
  
    getSound(url, callback) {
      var sound = null;
      if (this.sounds.hasOwnProperty(url)) {
        sound = this.sounds[url];
        callback(sound);
      } else {
        sound = this.load(url, callback);
      }
      sound.refCount++;
      return sound;
    }}
  
  
  var am = new AudioManager();
  
  var IceCavernSoundscape = {
    "name": "Pitch Cave",
    "playlooping": {
      "volume": 1.6,
      "pitch": 7.0,
      "sound": "https://s3-us-west-2.amazonaws.com/s.cdpn.io/281114/Iambloop.wav" },
  
    "playrandom": {
      "time": [5, 20],
      "volume": [0.4, 1],
      "pitch": [1.9, 1.05],
      "random": [
      "https://s3-us-west-2.amazonaws.com/s.cdpn.io/281114/Iceamb1.wav",
      "https://s3-us-west-2.amazonaws.com/s.cdpn.io/281114/iceamb2.wav",
      "https://s3-us-west-2.amazonaws.com/s.cdpn.io/281114/iceamb3.wav"] } };
  
  
  
  
  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  function getRandomFloat(min, max) {
    return Math.random() * (max - min) + max;
  }
  
  class Soundscape {
    constructor(json) {
      this.rules = json;
      this.name = this.rules.name || "Soundscape";
      this.looping = null;
      this.random = [];
  
      if (this.rules.hasOwnProperty("playlooping")) {
        var playlooping = this.rules.playlooping;
        this.looping = am.getSound(playlooping.sound, sound => {
          sound.volume = playlooping.volume;
          sound.pitch = playlooping.pitch;
          sound.loop = true;
          sound.play();
        });
      }
  
      if (this.rules.hasOwnProperty("playrandom")) {
        var playrandom = this.rules.playrandom;
        for (var url of playrandom.random)
        {
          this.random.push(am.getSound(url));
        }
        setTimeout(() => {this.playRandom();}, getRandomFloat(playrandom.time[0], playrandom.time[playrandom.time.length - 1]) * 1000);
      }
    }
  
    playRandom() {
      var playrandom = this.rules.playrandom;
      var index = getRandomInt(0, this.random.length - 1);
      var sound = this.random[index];
  
      sound.volume = getRandomFloat(playrandom.volume[0], playrandom.volume[playrandom.volume.length - 1]);
      sound.pitch = getRandomFloat(playrandom.pitch[0], playrandom.pitch[playrandom.pitch.length - 1]);
      sound.play();
  
      setTimeout(() => {this.playRandom();}, getRandomFloat(playrandom.time[0], playrandom.time[playrandom.time.length - 1]) * 1000);
    }}
  
  
  (function () {
    var ss = new Soundscape(IceCavernSoundscape);
    $("#soundscape").text(ss.name);
  })();