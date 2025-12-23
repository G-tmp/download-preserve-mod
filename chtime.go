package main

import (
	"encoding/binary"
	"encoding/json"
	"io"
	"os"
	"time"
)

type Request struct {
	Path  string  `json:"path"`
	MTime float64 `json:"mtime"` // unix seconds
}

type Response struct {
	OK    bool   `json:"ok"`
	Error string `json:"error,omitempty"`
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
	return err
}


func main() {
	req, err := readMessage()
	if err != nil {
		sendMessage(Response{OK: false, Error: err.Error()})	
		return 
	}

	if req.MTime > 0 {
		t := time.Unix(int64(req.MTime), 0)
		os.Chtimes(req.Path, t, t)
	}

	sendMessage(Response{OK: true})
}