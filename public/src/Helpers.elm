module Helpers exposing (..)

import Json.Encode as E

find : (a -> Bool) -> List a -> Maybe a
find a b = case (a, b) of
    (_, [])     -> Nothing
    (f, x::xs)  -> if(f x) then Just x else find f xs


fst : (a, b) -> a
fst (x, y) = x

snd : (a, b) -> b
snd (x, y) = y

logTransformed : String -> (a -> b) -> a -> a
logTransformed label f x = snd ((Debug.log label <| f x), x)