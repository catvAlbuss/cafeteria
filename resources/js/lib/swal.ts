import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

export const swalError = (title: string, text?: string) => {
    return Swal.fire({
        icon: 'error',
        title,
        text,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#C9A96E',
    });
};

export const swalSuccess = (title: string, text?: string) => {
    return Swal.fire({
        icon: 'success',
        title,
        text,
        timer: 1600,
        showConfirmButton: false,
    });
};

export const errorsToText = (errors: Record<string, unknown>) => Object.values(errors).join(' ');
