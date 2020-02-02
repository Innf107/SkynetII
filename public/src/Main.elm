module Main exposing (main)

import Browser
import Html exposing (..)
import Helpers exposing(..)
import Html.Events as E
import Html.Attributes as A
import Http
import Json.Encode as JE
import Json.Decode as JD
import File exposing (File)
import File.Select as Select
import Status as S exposing (Status)
import SelectStatus as SS exposing (SelectStatus)
import SkynetTypes exposing(..)
import AssociationList as AL


main = Browser.document {init=init, update=update, subscriptions=subs, view=view}

type alias Model = {
        server: ServerStatus,
        sounds: SoundStatus,
        settings: SettingStatus
    }


init : () -> (Model, Cmd Msg)
init _ = ({server=SS.Loading, sounds=S.Loading, settings=S.Loading}, Cmd.batch [Http.get {
            url = "/Servers",
            expect=Http.expectJson ReceivedServers serversDecoder
        },
        Http.get{
            url = "/Sounds",
            expect=Http.expectJson ReceivedSounds (JD.list (JD.string))
        },
        Http.get{
            url = "/Settings",
            expect=Http.expectJson ReceivedSettings (JD.list (JD.map2 (\x y -> (x,y)) (JD.field "key" JD.string) (JD.field "val" JD.bool)))
        }
        ])

type Msg = NOP
         | Perform (Cmd Msg)
         | ReceivedServers (Result (Http.Error) (List ServerPreview))
         | ReceivedVoiceChannels (Result (Http.Error) (List VoiceChannel))
         | ReceivedSounds (Result (Http.Error) (List String))
         | ReceivedSettings (Result (Http.Error) (List (String, Bool)))
         | SelectServer String
         | JoinVoiceChannel String
         | LeaveVChannel SelectedServer (List VoiceChannel)
         | PlaySound String
         | LoadedSoundToUpload File
         | UpdateSetting String Bool

update : Msg -> Model -> (Model, Cmd Msg)
update msg model = case msg of
    NOP -> (model, Cmd.none)
    Perform cmd -> (model, cmd)
    ReceivedServers res ->
            ({model|server=case res of
                Err e       -> SS.Error (Debug.toString e)
                Ok servers  -> SS.Selecting servers
            }, Cmd.none)
    SelectServer id ->
            let (newServer, cmd) = case model.server of
                    SS.Loading -> (SS.Loading, Cmd.none)
                    SS.Error e -> (SS.Error e, Cmd.none)
                    SS.Selected s -> (SS.Selected s, Cmd.none)
                    SS.Selecting servers -> case (servers |> find (\server -> server.id == id)) of
                        Nothing -> (SS.Error <| "Cannot get Server with id " ++ id, Cmd.none)
                        Just server -> (SS.Selected ({preview=server, voiceChannel=SS.Loading}),
                            Http.request {
                                          url = "/VoiceChannels",
                                          method="POST",
                                          expect=Http.expectJson ReceivedVoiceChannels voiceChannelsDecoder,
                                          headers=[],
                                          tracker=Nothing,
                                          timeout=Nothing,
                                          body= Http.jsonBody (encodeServerID server.id)
                                      })
            in
            ({model|server=newServer}, cmd)
    ReceivedVoiceChannels res ->
                                let newChannel = case res of
                                        Err e -> SS.Error (Debug.toString e)
                                        Ok channels -> SS.Selecting channels
                                 in
                                 let newServer = model.server |> SS.map (\s -> {s|voiceChannel=newChannel})
                                 in ({model|server=newServer}, Cmd.none)
    LeaveVChannel server channels ->
            let newServer = {server|voiceChannel=SS.Selecting channels} in
              ({model|server = SS.Selected newServer},
                  Http.post {
                  url="/LeaveVoiceChannel",
                body=Http.jsonBody <| encodeServerID server.preview.id,
                expect=Http.expectWhatever (\_ -> NOP)
            })
    ReceivedSounds res -> case res of
            Err e -> ({model|sounds=S.Error <| Debug.toString e}, Cmd.none)
            Ok s  -> ({model|sounds=S.Loaded s}, Cmd.none)
    PlaySound file -> (model, Http.post {
            url="/play",
            expect=Http.expectWhatever (\_ -> NOP),
            body=Http.jsonBody (JE.object [("file", JE.string file)])
        })
    LoadedSoundToUpload file ->
            ({model|sounds = model.sounds |> S.map (\sounds -> List.sort <| sounds ++ [File.name file])}
            , Http.request {
            url="/uploadSound",
            method="PUT",
            headers=[Http.header "content-type" <| File.mime file, Http.header "X-Filename" <| File.name file],
            body=Http.fileBody file,
            expect=Http.expectWhatever (\_ -> NOP),
            timeout=Nothing,
            tracker=Nothing
        })
    ReceivedSettings res -> case res of
        Err e -> ({model|settings=S.fromHttpError e}, Cmd.none)
        Ok settings -> ({model|settings=S.Loaded settings}, Cmd.none)
    UpdateSetting key val ->
        ({model|settings = model.settings
                |> S.map (\s -> s |> AL.updateAt key (\_ -> val))
        }, Http.post {
            url="/updateSetting",
            expect=Http.expectWhatever (\_ -> NOP),
            body=Http.jsonBody <| JE.object [("key", JE.string key), ("val", JE.bool val)]
        })
    JoinVoiceChannel id  ->
        let newServer = model.server |> SS.map (\server ->
                {server|voiceChannel= (case server.voiceChannel of
                                    SS.Loading -> SS.Loading
                                    SS.Error e  -> SS.Error e
                                    SS.Selecting channels ->
                                        find (\ch -> ch.id == id) channels
                                        |> Maybe.map (\x -> SS.Selected (x, channels))
                                        |> Maybe.withDefault (SS.Error <| "Voice channel with id " ++ id ++ " does not exist!")
                                    SS.Selected (_, channels) ->
                                        find (\ch -> ch.id == id) channels
                                        |> Maybe.map (\x -> SS.Selected (x, channels))
                                        |> Maybe.withDefault (SS.Error <| "Voice channel with id " ++ id ++ " does not exist!"))
                                        })
        in
        ({model|server=newServer}, newServer |> SS.andThen2Maybe (\s ->
            s.voiceChannel |> SS.map2Maybe (\(v, _) ->
                Http.post  {
                    url="/JoinVoiceChannel",
                    body=Http.jsonBody (JE.object [("serverID", JE.string s.preview.id), ("voiceChannelID", JE.string v.id)]),
                    expect= Http.expectWhatever (\_ -> NOP)
            })) |> Maybe.withDefault Cmd.none)

subs : Model -> Sub Msg
subs _ = Sub.none

view : Model -> Browser.Document Msg
view model = {
    title = "SkynetII",
    body = [
        Html.node "link" [A.rel "stylesheet", A.href "main.css"] [],
        case model.server of
            SS.Loading -> p [] [text "Loading Servers..."]
            SS.Error e -> pre [] [text e]
            SS.Selecting servers -> viewSelecting model servers
            SS.Selected server -> viewSelected model server
    ]
    }

viewSelecting : Model -> List ServerPreview -> Html Msg
viewSelecting model servers = ul []
        (servers |> List.map (\server -> li [] [
            button [E.onClick <| SelectServer server.id] [img [A.src server.iconURL] []],
            p [] [text server.name]
        ]))


viewSelected : Model -> SelectedServer -> Html Msg
viewSelected model server = div [] [
        img [A.src server.preview.iconURL] [],
        h1 [] [text server.preview.name],
        viewSettings model server,
        h3 [] [text "Voice Channels:"],
        viewLeaveButton model server,
        viewVoiceChannel model server.voiceChannel,
        h3 [] [text "Sound Clips:"],
        viewUploadSound model,
        viewSounds model model.sounds
    ]

viewVoiceChannel : Model -> VoiceChannelStatus -> Html Msg
viewVoiceChannel model channelStatus = case channelStatus of
    SS.Loading -> p [] [text "Loading Voice Channels..."]
    SS.Error e -> pre [] [text e]
    SS.Selecting channels -> ul [] (channels
                                             |> List.map (\channel ->
                                                   li [] [
                                                       button [E.onClick <| JoinVoiceChannel channel.id] [text channel.name]
                                                   ]))
    SS.Selected (ch, channels) -> ul [] (channels
                                                 |> List.map (\channel ->
                                                       li [] [
                                                           button
                                                            [E.onClick <| JoinVoiceChannel channel.id, A.style "background-color" (if ch == channel then "green" else "white")]
                                                            [text channel.name]
                                                       ]))

viewSounds : Model -> SoundStatus -> Html Msg
viewSounds model soundStatus =
        (case soundStatus of
            S.Loading       -> p [] [text "Loading Sound Clips..."]
            S.Error e       -> pre [] [text e]
            S.Loaded sounds -> ul [] <| List.map (\s -> li []
                                 [
                                     button [E.onClick <| PlaySound s] [
                                         text s
                                     ]
                                 ]) sounds
        )

viewUploadSound : Model -> Html Msg
viewUploadSound model = button [E.onClick <| Perform <| Select.file soundMimes LoadedSoundToUpload] [text "Upload Sound File"]

viewLeaveButton : Model -> SelectedServer -> Html Msg
viewLeaveButton model server =
    server.voiceChannel
    |> SS.map2Maybe (\(_, cs) -> button [A.class "LeaveButton", E.onClick (LeaveVChannel server cs)] [text "Leave voice channel"])
    |> Maybe.withDefault (text "")

viewSettings : Model -> SelectedServer -> Html Msg
viewSettings model server = model.settings
    |> S.map (\settings ->
        ul [] (settings
            |> List.map (\(key, val) ->
            li [] [
                button [A.classList [("buttonOn", val), ("buttonOff", not val)], E.onClick <| UpdateSetting key (not val)] [text key]
            ])
        ))
    |> S.withLoadingError
        (pre [] [text "Loading Settings..."])
        (\e -> pre [] [text e])