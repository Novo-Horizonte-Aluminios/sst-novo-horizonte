import Swal from 'sweetalert2';

const MySwal = Swal.mixin({
  customClass: {
    popup: 'swal-modern-popup',
    title: 'swal-modern-title',
    htmlContainer: 'swal-modern-html',
    confirmButton: 'swal-modern-confirm',
    cancelButton: 'swal-modern-cancel',
    icon: 'swal-modern-icon'
  },
  buttonsStyling: false
});

export default MySwal;
