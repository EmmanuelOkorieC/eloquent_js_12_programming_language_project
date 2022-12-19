//first implementation
function skipSpace(string) {
    let newString = string.replace(/\#\s*.*/g, "")

    let first = newString.search(/\S/)
    if(first == -1) return ""
    return newString.slice(first)
}

//second implementation
function skipSpace(string) {
    return string.replace(/\#\s*.*|\s/g, "")
}