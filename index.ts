import discord = require('discord.js')
import express = require('express')
import bodyParser = require('body-parser')
import getRawBody = require('raw-body')
import contentType = require('content-type')
import xcss    = require('prophet-xcss')
import fs = require('fs-jetpack')
import path = require('path')
import Color = require('color')
const app = express()
const client = new discord.Client()
const PORT = 4000;
const soundPath = `${__dirname}/../data/Sounds`

app.use(xcss([`${__dirname}/public`]))
app.use(express.json())

app.use(express.static(`${__dirname}/public`))

const settings = {
    "tts":false,
    "nokick":false,
    "nomove":false,
    "nodelete":false,
    "rainbow!":false,
    "chirping":false
}

client.on('ready', () => console.log('SkynetII is ready!'))

client.login('NjQ4MTM5NDczMDMyNDQ1OTcz.Xdp4-A.t6mQYuhmtFcdlSvXHlDZfpraCxI')
app.listen(PORT, () => console.log(`listening on Port ${PORT}`))

//rainbow
let hue = 0;
const updateRate = 800
const updateAmount = 12
setInterval(() => {
    if(!settings["rainbow!"])
        return
    client.guilds.forEach(async x => {
        const role = x.roles.find(role => role.name === "Rainbow")
        if(role){
            hue = (hue + updateAmount) % 360
            const newColor = Color.hsv([hue, 255, 255])
            role.setColor(newColor.rgbNumber(), "Rainbow Role!")
            //console.log(`updating ${role.name}@${x.name} to hue ${hue} and color ${newColor.hex()}`)
        }
    })
}, updateRate)

let speakState = false;
let curChirpStream : discord.StreamDispatcher = null
const chirpInterval = 10000
setInterval(() => { 
    if(!settings.chirping)
        return;
    client.voiceConnections.forEach(v => {
        const speaking = v.channel.members.reduce((acc, mem) => acc || mem.speaking)
        if(speakState != speaking){
            speakState = speaking
            
            if(!speaking)
                curChirpStream = v.playFile(`${soundPath}/chirp.mp3`)
            else if(curChirpStream)
                curChirpStream.pause()
        }
    })
}, chirpInterval)

//nodelete
client.on('messageDelete', m => {
    if(settings.nodelete)
    {
        const t = m.createdAt
        m.channel.send(`[${m.author} ${t.getDay()}.${t.getMonth()}.${t.getFullYear()} ${t.getHours()}:${t.getMinutes()}]:${m.content}       (powered by NoDelete)`)
    }
})

client.on('rateLimit', x => {
    console.log(JSON.stringify(x))
})

const commands : {[cmd:string]:(data:string, msg: discord.Message) => void} = {
    elmo:(data, msg) => {
        const elmosongs = fs.read(`${soundPath}/../elmosongs.txt`).split('\n').map(s => s.split(':'))
        if(data.trim() === 'list'){
            msg.channel.send(elmosongs.map(x => x.join(' : ')).join('\n'))
            return;
        }
        const song = elmosongs.find(([k, v]) => k.trim() == data.trim())[1].trim()
        play(song)
        console.log(`playing ${song} for command:'.elmo ${data}'`)
    }
}


client.on('message', msg => {
    if(msg.content.startsWith('.'))
    {
        const cmd = msg.content.slice(1).split(' ')[0]
        if(cmd in commands)
        {
            commands[cmd](msg.content.slice(1 + cmd.length), msg)
        }
    }
})


const play = (file : string) => {
    client.voiceConnections.forEach(v => {
        const disp = v.playFile(`${soundPath}/${file}`)
        //#region error-handling 
        let isValid = false;
        disp.on('speaking', x => {
            if(!x && !isValid)
                console.log(`Error! Sound file ${file} cannot be played!`)
            else
                isValid = true;
        })
        //#endregion
        console.log(`playing ${file} on ${v.channel.name}@${v.channel.guild.name}`)
    })
}

//API
app.get('/Servers', (req, res) => {
    const servers = client.guilds.array().map(server => {return {
        name: server.name,
        id: server.id,
        iconURL: server.iconURL
    }})
    res.send(servers)
})

app.get('/Users', (req, res) => {
    const serverID: string = req.body.serverID;
    const server = client.guilds.get(serverID) 
    const clients = server.members.array().map((mem) => {return {
        displayName: mem.displayName,
        username: mem.user.username, 
        id: mem.id,
    }});
    res.send(clients)
})

app.post('/VoiceChannels', (req, res) => {
    const serverID: string = req.body.serverID;
    const server = client.guilds.get(serverID);
    const voiceChannels = server.channels.array().filter(x => x.type === 'voice').map(ch => {return {
        name: ch.name,
        id: ch.id,
    }})
    res.send(voiceChannels)
})

app.post('/JoinVoiceChannel', async (req, res) => {
    const serverID: string = req.body.serverID
    const server = client.guilds.get(serverID)
    const voiceChannelID: string = req.body.voiceChannelID
    const voiceChannel = server.channels.get(voiceChannelID) as discord.VoiceChannel
    await voiceChannel.join()
    res.sendStatus(200)
})

app.post('/LeaveVoiceChannel', async (req, res) => {
    const serverID: string = req.body.serverID
    client.voiceConnections
        .filter(x => x.channel.guild.id === serverID)
        .forEach(x => x.channel.leave())
    res.sendStatus(200)
})

app.post('/play', (req, res) => {
    const file: string = req.body.file
    play(file)
    res.sendStatus(200)
})

app.get('/sounds', (req, res) => {
    res.send(fs.list(soundPath))
})

app.get('/settings', (req, res) => {
    const keys = Object.keys(settings)
    const values = Object.values(settings)
    const json = zip(keys, values).map(([x, y]) => {return {
        key: x,
        val: y
    }})
    res.json(json)
})

app.post('/updateSetting', (req, res) => {
    const key = req.body.key as string
    const val = req.body.val as boolean

    settings[key] = val
    res.sendStatus(200)
})

app.put('/uploadSound', async (req, res) => {
    const fileName = req.headers['x-filename']
    const filePath = `../data/Sounds/${fileName}`
    console.log({filePath})
    const file = fs.createWriteStream(filePath)

    file.on('open', fd => {
        req.on('data', x => file.write(x))

        req.on('end', () => {
            console.log('done uploading!')
            file.end()
            res.sendStatus(200)
        })
    })
})

//HELPERS
function zip<a, b>(as: a[], bs:b[]) : [a, b][] {
    if(as.length === 0 || bs.length === 0)
        return []
    //else
    const x  = as[0]
    const xs = as.slice(1)
    const y  = bs[0]
    const ys = bs.slice(1)
    return [[x, y], ...zip(xs, ys)]
}