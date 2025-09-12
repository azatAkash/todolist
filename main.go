package main

import (
	"embed"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
  app := NewApp()

  if err := wails.Run(&options.App{
    Title: "todolist",
    Width: 1024, Height: 768,
    AssetServer: &assetserver.Options{ Assets: assets },
    OnStartup: app.startup,
    Bind: []interface{}{ app },   // <-- expose methods of App to JS
  }); err != nil {
    panic(err)
  }
}
