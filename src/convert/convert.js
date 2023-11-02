const { Monitor } = require("../lib/monitor")
const AdmZip = require("adm-zip");

const osuz = ['!os']


module.exports = class extends Monitor{
    constructor(){
        super(osuz)
    }

    async run(message){
        const file = message.attachments.first()

        async function extractArchive(filepath) {
            const zip = new AdmZip(filepath)
          
            for (const zipEntry of zip.getEntries()) {
              // __MACOSXフォルダなど、フォルダは無視
              if (zipEntry.isDirectory) {
                continue
              }
                   // ファイル名
              console.log(zipEntry.entryName)
            }
          }
        
        if (!file) return
        extractArchive(file.url)

    }
    
}