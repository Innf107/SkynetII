"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
var discord = require("discord.js");
var express = require("express");
var xcss = require("prophet-xcss");
var fs = require("fs-jetpack");
var Color = require("color");
var app = express();
var client = new discord.Client();
var PORT = 4000;
var soundPath = __dirname + "/../data/Sounds";
app.use(xcss([__dirname + "/public"]));
app.use(express.json());
app.use(express.static(__dirname + "/public"));
var settings = {
    "tts": false,
    "nokick": false,
    "nomove": false,
    "nodelete": false,
    "rainbow!": false,
    "chirping": false
};
client.on('ready', function () { return console.log('SkynetII is ready!'); });
client.login('NjQ4MTM5NDczMDMyNDQ1OTcz.Xdp4-A.t6mQYuhmtFcdlSvXHlDZfpraCxI');
app.listen(PORT, function () { return console.log("listening on Port " + PORT); });
//rainbow
var hue = 0;
var updateRate = 800;
var updateAmount = 12;
setInterval(function () {
    if (!settings["rainbow!"])
        return;
    client.guilds.forEach(function (x) { return __awaiter(void 0, void 0, void 0, function () {
        var role, newColor;
        return __generator(this, function (_a) {
            role = x.roles.find(function (role) { return role.name === "Rainbow"; });
            if (role) {
                hue = (hue + updateAmount) % 360;
                newColor = Color.hsv([hue, 255, 255]);
                role.setColor(newColor.rgbNumber(), "Rainbow Role!");
                //console.log(`updating ${role.name}@${x.name} to hue ${hue} and color ${newColor.hex()}`)
            }
            return [2 /*return*/];
        });
    }); });
}, updateRate);
var speakState = false;
var curChirpStream = null;
var chirpInterval = 10000;
setInterval(function () {
    if (!settings.chirping)
        return;
    client.voiceConnections.forEach(function (v) {
        var speaking = v.channel.members.reduce(function (acc, mem) { return acc || mem.speaking; });
        if (speakState != speaking) {
            speakState = speaking;
            if (!speaking)
                curChirpStream = v.playFile(soundPath + "/chirp.mp3");
            else if (curChirpStream)
                curChirpStream.pause();
        }
    });
}, chirpInterval);
//nodelete
client.on('messageDelete', function (m) {
    if (settings.nodelete) {
        var t = m.createdAt;
        m.channel.send("[" + m.author + " " + t.getDay() + "." + t.getMonth() + "." + t.getFullYear() + " " + t.getHours() + ":" + t.getMinutes() + "]:" + m.content + "       (powered by NoDelete)");
    }
});
client.on('rateLimit', function (x) {
    console.log(JSON.stringify(x));
});
var commands = {
    elmo: function (data, msg) {
        var elmosongs = fs.read(soundPath + "/../elmosongs.txt").split('\n').map(function (s) { return s.split(':'); });
        if (data.trim() === 'list') {
            msg.channel.send(elmosongs.map(function (x) { return x.join(' : '); }).join('\n'));
            return;
        }
        var song = elmosongs.find(function (_a) {
            var k = _a[0], v = _a[1];
            return k.trim() == data.trim();
        })[1].trim();
        play(song);
        console.log("playing " + song + " for command:'.elmo " + data + "'");
    }
};
client.on('message', function (msg) {
    if (msg.content.startsWith('.')) {
        var cmd = msg.content.slice(1).split(' ')[0];
        if (cmd in commands) {
            commands[cmd](msg.content.slice(1 + cmd.length), msg);
        }
    }
});
var play = function (file) {
    client.voiceConnections.forEach(function (v) {
        var disp = v.playFile(soundPath + "/" + file);
        //#region error-handling 
        var isValid = false;
        disp.on('speaking', function (x) {
            if (!x && !isValid)
                console.log("Error! Sound file " + file + " cannot be played!");
            else
                isValid = true;
        });
        //#endregion
        console.log("playing " + file + " on " + v.channel.name + "@" + v.channel.guild.name);
    });
};
//API
app.get('/Servers', function (req, res) {
    var servers = client.guilds.array().map(function (server) {
        return {
            name: server.name,
            id: server.id,
            iconURL: server.iconURL
        };
    });
    res.send(servers);
});
app.get('/Users', function (req, res) {
    var serverID = req.body.serverID;
    var server = client.guilds.get(serverID);
    var clients = server.members.array().map(function (mem) {
        return {
            displayName: mem.displayName,
            username: mem.user.username,
            id: mem.id
        };
    });
    res.send(clients);
});
app.post('/VoiceChannels', function (req, res) {
    var serverID = req.body.serverID;
    var server = client.guilds.get(serverID);
    var voiceChannels = server.channels.array().filter(function (x) { return x.type === 'voice'; }).map(function (ch) {
        return {
            name: ch.name,
            id: ch.id
        };
    });
    res.send(voiceChannels);
});
app.post('/JoinVoiceChannel', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var serverID, server, voiceChannelID, voiceChannel;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                serverID = req.body.serverID;
                server = client.guilds.get(serverID);
                voiceChannelID = req.body.voiceChannelID;
                voiceChannel = server.channels.get(voiceChannelID);
                return [4 /*yield*/, voiceChannel.join()];
            case 1:
                _a.sent();
                res.sendStatus(200);
                return [2 /*return*/];
        }
    });
}); });
app.post('/LeaveVoiceChannel', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var serverID;
    return __generator(this, function (_a) {
        serverID = req.body.serverID;
        client.voiceConnections
            .filter(function (x) { return x.channel.guild.id === serverID; })
            .forEach(function (x) { return x.channel.leave(); });
        res.sendStatus(200);
        return [2 /*return*/];
    });
}); });
app.post('/play', function (req, res) {
    var file = req.body.file;
    play(file);
    res.sendStatus(200);
});
app.get('/sounds', function (req, res) {
    res.send(fs.list(soundPath));
});
app.get('/settings', function (req, res) {
    var keys = Object.keys(settings);
    var values = Object.values(settings);
    var json = zip(keys, values).map(function (_a) {
        var x = _a[0], y = _a[1];
        return {
            key: x,
            val: y
        };
    });
    res.json(json);
});
app.post('/updateSetting', function (req, res) {
    var key = req.body.key;
    var val = req.body.val;
    settings[key] = val;
    res.sendStatus(200);
});
app.put('/uploadSound', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var fileName, filePath, file;
    return __generator(this, function (_a) {
        fileName = req.headers['x-filename'];
        filePath = "../data/Sounds/" + fileName;
        console.log({ filePath: filePath });
        file = fs.createWriteStream(filePath);
        file.on('open', function (fd) {
            req.on('data', function (x) { return file.write(x); });
            req.on('end', function () {
                console.log('done uploading!');
                file.end();
                res.sendStatus(200);
            });
        });
        return [2 /*return*/];
    });
}); });
//HELPERS
function zip(as, bs) {
    if (as.length === 0 || bs.length === 0)
        return [];
    //else
    var x = as[0];
    var xs = as.slice(1);
    var y = bs[0];
    var ys = bs.slice(1);
    return __spreadArrays([[x, y]], zip(xs, ys));
}
