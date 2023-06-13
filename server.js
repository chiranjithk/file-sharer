require('dotenv').config()
const multer = require('multer')
const express = require('express')
const app = express()
const bcrypt = require('bcrypt')
const File = require('./models/File')

const mongoose = require("mongoose")

const upload = multer({ dest : "uploads"})

app.use(express.urlencoded({extended:true}))
app.set('view engine','ejs')

mongoose.connect('mongodb://localhost/fileshare')

app.get('/',(req,res) => {
    res.render('index')
})

app.post('/uploads', upload.single("file"), async (req,res)=>{

    const fileData = {
        path: req.file.path,
        originalName: req.file.originalname
    }

    if(req.body.password != null && req.body.password !==""){
        fileData.password= await bcrypt.hash(req.body.password,10)
    }

    const file = await File.create(fileData)
    res.render('index',{fileLink:`${req.headers.origin}/file/${file.id}`})
})

app.route('/file/:id').get(handledownload).post(handledownload)

async function handledownload(req,res){

    const file = await File.findById(req.params.id)

    if(file.password!=null){
        if(req.body.password==null){
            res.render('password')
            return
        }
        if(!await(bcrypt.compare(req.body.password,file.password))){
            res.render('password',{error:true})
            return
        }
    }

    file.downloadCount++
    await file.save()
    res.download(file.path,file.originalName)
}

app.listen(process.env.PORT)