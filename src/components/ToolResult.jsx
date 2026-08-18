function ToolResult({ result }) {
  const { title, status = "success", detail = "" } = result;

  return (
    <section aria-label={`Tool result: ${title}`}>
      <h3>{title}</h3>

      {status === "loading" && <p role="status">Running {title}...</p>}
      {status === "error" && <p role="alert">{detail}</p>}
      {status === "success" && <p>{detail}</p>}
    </section>
  );
}

export default ToolResult;