module SkynetTypes exposing (..)

import Http
import Json.Decode as D
import Json.Encode as E
import SelectStatus as SS exposing (SelectStatus)
import Status as S exposing (Status)


type alias SoundStatus = Status (List String)

type alias SettingStatus = Status (List (String, Bool))

type alias ServerStatus = SelectStatus (List ServerPreview) SelectedServer

type alias VoiceChannelStatus = SelectStatus (List VoiceChannel) (VoiceChannel, List VoiceChannel)



type alias ServerPreview = {
    name: String,
    id: String,
    iconURL: String
    }

type alias SelectedServer = {
    preview: ServerPreview,
    voiceChannel: VoiceChannelStatus
    }

type alias VoiceChannel = {
        name: String,
        id: String
    }

serversDecoder : D.Decoder (List ServerPreview)
serversDecoder = D.list (D.map3 ServerPreview
                    (D.field "name" D.string)
                    (D.field "id" D.string)
                    (D.field "iconURL" D.string))

voiceChannelsDecoder : D.Decoder (List VoiceChannel)
voiceChannelsDecoder = D.list (D.map2 VoiceChannel
                            (D.field "name" D.string)
                            (D.field "id" D.string))

encodeServerID : String -> E.Value
encodeServerID str = E.object [("serverID", E.string str)]

soundMimes : List String
soundMimes = ["audio/basic", "audio/L24", "audio/mid", "audio/mpeg", "audio/mp4",
              "audio/x-aiff", "audio/x-mpegurl", "audio/vnd.rn-realaudio",
              "audio/ogg", "audio/vorbis", "audio/vnd.wav"]