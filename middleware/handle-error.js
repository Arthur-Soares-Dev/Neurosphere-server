function handleError() {
  return (err, req, res, next) => {
    const status = err.status || 500;

    res.status(status).json({
      title: err.title || 'Erro',
      message: err.message || 'Erro desconhecido',
    });
  };
}

module.exports = handleError;
