module Status exposing (..)

import Http

type Status a = Loading
              | Error String
              | Loaded a

andThen : (a -> Status b) -> Status a -> Status b
andThen f s = case s of
    Loading -> Loading
    Error e -> Error e
    Loaded x-> f x

map : (a -> b) -> Status a -> Status b
map f = andThen (Loaded << f)

andThen2Maybe : (a -> Maybe b) -> Status a -> Maybe b
andThen2Maybe f s = case s of
    Loading -> Nothing
    Error e -> Nothing
    Loaded x-> f x

map2Maybe : (a -> b) -> Status a -> Maybe b
map2Maybe f = andThen2Maybe (Just << f)

withLoadingError : a -> (String -> a) -> Status a -> a
withLoadingError loading error status = case status of
    Loading -> loading
    Error e -> error e
    Loaded x-> x

fromHttpError : Http.Error -> Status a
fromHttpError err = case err of
    Http.BadUrl string -> Error <| "BadUrl (" ++ string ++ ")"
    Http.Timeout -> Error "Timeout"
    Http.NetworkError -> Error "NetworkError"
    Http.BadStatus int -> Error <| "BadStatus (" ++ String.fromInt int ++ ")"
    Http.BadBody string -> Error <| "BadBody (" ++ string ++ ")"


