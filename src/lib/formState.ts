export interface FormState<T = unknown, R = unknown> {
  input: T;
  result?: R;
  error: unknown;
}
