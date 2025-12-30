package main

import (
	"encoding/binary"
	"encoding/json"
	"io"
	"os"
	"time"
	"fmt"
)

type Request struct {
	Path  string	`json:"path"`
	MTime int64		`json:"mtime"` // unix seconds
}

type Response struct {
	OK    bool   `json:"ok"`
	Error string `json:"error,omitempty"`
}

func (req Request)String() string{
	return fmt.Sprintf("%s | %s", req.Path, time.Unix(req.MTime, 0).UTC().Format(time.RFC1123Z))
}

func (res Response)String() string{
	return fmt.Sprintf("%t | %v", res.OK, res.Error)
}

func readMessage() (*Request, error) {
	var size uint32
	if err := binary.Read(os.Stdin, binary.LittleEndian, &size); err != nil {
		return nil, err
	}

	buf := make([]byte, size)
	if _, err := io.ReadFull(os.Stdin, buf); err != nil {
		return nil, err
	}

	var req Request
	return &req, json.Unmarshal(buf, &req)
}

func sendMessage(resp Response) error {
	data, _ := json.Marshal(resp)
	if err := binary.Write(os.Stdout, binary.LittleEndian, uint32(len(data))); err != nil {
		return err
	}
	_, err := os.Stdout.Write(data)
	os.Stdout.Sync()
	return err
}


func main() {

	logFile := "/tmp/native-chtime.log"
	f, err := os.OpenFile(logFile, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		f = nil
	} else {
		defer f.Close()
	}
	log := func(s string){
		if f != nil{
			f.Write([]byte(s + "\n"))
		}
	}

	log(time.Now().String())
	
	req, err := readMessage()
	if err != nil {
		resp := Response{OK: false, Error: err.Error()}
		sendMessage(resp)
		log(resp.String())
		return 
	}
	log(req.String())
	
	if req.MTime > 0 {
		t := time.Unix(int64(req.MTime), 0)
		os.Chtimes(req.Path, t, t)
	}
	resp := Response{OK: true}
	sendMessage(resp)
	log(resp.String())
}