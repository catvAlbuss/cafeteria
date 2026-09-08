import { useEffect, useRef, useState } from "react";
import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats
} from "html5-qrcode";


interface Props {

  onScan: (codigo: string) => void;

  activo: boolean;

}



export default function QRScanner({

  onScan,
  activo

}: Props) {


  const scanner = useRef<Html5Qrcode | null>(null);

  const iniciado = useRef(false);

  const ultimo = useRef("");

  const [mensaje, setMensaje] = useState(
    "Preparando cámara..."
  );




  useEffect(() => {


    let mounted = true;



    const iniciar = async () => {


      try {


        const lector =
          new Html5Qrcode(
            "lector"
          );



        scanner.current = lector;



        // Obtener cámaras disponibles

        const camaras =
          await Html5Qrcode.getCameras();



        if (!camaras.length) {

          setMensaje(
            "No hay cámara disponible"
          );

          return;

        }



        // usar cámara trasera

        const camaraTrasera =
          camaras.find(c =>
            c.label
              .toLowerCase()
              .includes("back")
          )
            ?.id
          ||
          camaras[0].id;



        await lector.start(


          camaraTrasera,


          {


            fps: 15,

            qrbox: (viewfinderWidth, viewfinderHeight) => {

              return {

                width: Math.min(
                  viewfinderWidth * 0.9,
                  400
                ),

                height: 180

              };

            },

            aspectRatio: 1.777,


            formatsToSupport: [


              Html5QrcodeSupportedFormats.QR_CODE,


              Html5QrcodeSupportedFormats.EAN_13,


              Html5QrcodeSupportedFormats.EAN_8,


              Html5QrcodeSupportedFormats.CODE_128,


              Html5QrcodeSupportedFormats.CODE_39,


              Html5QrcodeSupportedFormats.UPC_A,


              Html5QrcodeSupportedFormats.UPC_E,


              Html5QrcodeSupportedFormats.ITF



            ]

          },



          (codigo) => {


            console.log(
              "DETECTADO:",
              codigo
            );



            if (
              ultimo.current === codigo
            )
              return;



            ultimo.current = codigo;



            setMensaje(
              "Código leído ✅"
            );



            onScan(codigo);



            setTimeout(() => {

              ultimo.current = "";

            }, 2000);



          },



          () => { }



        );



        if (mounted) {


          iniciado.current = true;


          setMensaje(
            "Apunta al código de barras"
          );


        }



      }
      catch (error) {


        console.log(
          "ERROR SCANNER:",
          error
        );


        setMensaje(
          "Error cámara ❌"
        );


      }


    };



    iniciar();



    return () => {


      mounted = false;



      if (
        scanner.current &&
        iniciado.current
      ) {


        scanner.current.stop()
          .then(() => {


            scanner.current?.clear();


          });


      }


    };



  }, []);





  useEffect(() => {


    if (
      !scanner.current ||
      !iniciado.current
    )
      return;



    if (activo) {

      scanner.current.resume();

    }
    else {

      scanner.current.pause();

    }


  }, [activo]);







  return (

    <div className="
            flex
            flex-col
            items-center
            gap-3
        ">


      <div

        id="lector"

        className="
                w-[450px]
                h-[250px]
                bg-black
                rounded-xl
                overflow-hidden
                border-4
                border-green-500
                "

      />


      <p className="
                font-bold
            ">

        {mensaje}

      </p>



    </div>

  );


}