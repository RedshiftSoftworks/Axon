function cnsl(txt, color){
  try {
    console.log("%c"+txt[0]+" %c"+ txt[1] ,"color:"+ color[0],"color:"+color[1])
  } catch (err) {
    console.error(err)
  }
}

export { cnsl }
