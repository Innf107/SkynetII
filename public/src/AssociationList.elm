module AssociationList exposing (..)
import Helpers exposing (..)

type alias AssociationList k v = List (k, v)

get : k -> AssociationList k v -> Maybe v
get key al = al |> find (\(k, _) -> k == key) |> Maybe.map snd

map : (v -> v2) -> AssociationList k v -> AssociationList k v2
map f = List.map (\(k, v) -> (k, f v))

updateAt : k -> (v -> v) -> AssociationList k v -> AssociationList k v
updateAt key f al = al |> List.map (\(k, v) -> (k, if k == key then f v else v))