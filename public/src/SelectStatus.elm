module SelectStatus exposing (..)

type SelectStatus a b = Loading
              | Error String
              | Selecting a
              | Selected b

andThen : (b -> SelectStatus a c) -> SelectStatus a b -> SelectStatus a c
andThen f status = case status of
    Loading      -> Loading
    Error e      -> Error e
    Selecting s  -> Selecting s
    Selected s   -> f s

map : (b -> c) -> SelectStatus a b -> SelectStatus a c
map f = andThen (\x -> Selected (f x))

map2Maybe : (b -> c) -> SelectStatus a b -> Maybe c
map2Maybe f status = case status of
    Loading      -> Nothing
    Error _      -> Nothing
    Selecting _  -> Nothing
    Selected s   -> Just <| f s

andThen2Maybe : (b -> Maybe c) -> SelectStatus a b -> Maybe c
andThen2Maybe f status = case status of
    Loading      -> Nothing
    Error _      -> Nothing
    Selecting _  -> Nothing
    Selected s   -> f s