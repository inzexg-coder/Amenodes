CALC_NODE_SIZE    EQU 56
CALC_OP_OFF       EQU 32  
CALC_RESULT_PTR   EQU 40 
CALC_RESULT_LEN   EQU 48  
CALC_DIRTY        EQU 52  

CALC_TYPE EQU 4

SQRT12_CONST  EQU 3.4641016151377544

calc_set_op:
    mov [rdi + CALC_OP_OFF], sil   ; SIL = op
    mov byte [rdi + CALC_DIRTY], 1
    TRIGGER_DEPENDENTS rdi
    ret

calc_free_result:
    mov rsi, [rdi + CALC_RESULT_PTR]
    test rsi, rsi
    jz .skip
    push rdi
    mov rdi, rsi
    call free
    pop rdi
.skip:
    mov qword [rdi + CALC_RESULT_PTR], 0
    mov qword [rdi + CALC_RESULT_LEN], 0
    ret

calc_compute:
    push rbp
    mov rbp, rsp
    push rbx
    push r12
    push r13
    push r14
    push r15

    mov rbx, rdi             
    cmp byte [rbx + CALC_DIRTY], 0
    je .already_computed

    call calc_free_result

    call calc_fetch_inputs          
    mov r12, rax                     ; r12 = number_of_sources
    mov r13, r8                      ; ptr0
    mov r14, r9                      ; len0
    mov r15, r10                     ; ptr1
    ; rcx = len1 (в r11)

    mov al, [rbx + CALC_OP_OFF]
    cmp al, 0
    je .op_div3
    cmp al, 1
    je .op_div_sqrt12
    cmp al, 2
    je .op_sqrt_sum_sq
    jmp .done

.op_div3:
    ; результат[i] = source0[i] / 3.0
    ; если source0 пуст, результат пуст
    mov rsi, r14                     ; len0
    test rsi, rsi
    jz .empty
    shl rsi, 3
    call malloc                  
    test rax, rax
    jz .done
    mov [rbx + CALC_RESULT_PTR], rax
    mov [rbx + CALC_RESULT_LEN], r14
    mov rcx, r14                    
    mov rdx, rax                  
    mov rsi, r13                  
    movsd xmm1, qword [.const_3]    ; 3.0
.loop_div3:
    test rcx, rcx
    jz .done
    movsd xmm0, qword [rsi]
    divsd xmm0, xmm1
    movsd qword [rdx], xmm0
    add rsi, 8
    add rdx, 8
    dec rcx
    jmp .loop_div3

.op_div_sqrt12:
    mov rsi, r14
    test rsi, rsi
    jz .empty
    shl rsi, 3
    call malloc
    test rax, rax
    jz .done
    mov [rbx + CALC_RESULT_PTR], rax
    mov [rbx + CALC_RESULT_LEN], r14
    mov rcx, r14
    mov rdx, rax
    mov rsi, r13
    movsd xmm1, qword [.const_sqrt12]
.loop_div_sqrt12:
    test rcx, rcx
    jz .done
    movsd xmm0, qword [rsi]
    divsd xmm0, xmm1
    movsd qword [rdx], xmm0
    add rsi, 8
    add rdx, 8
    dec rcx
    jmp .loop_div_sqrt12

.op_sqrt_sum_sq:
    cmp r12, 1
    je .single_source
  
    mov rcx, r14                     ; len0
    mov rdx, r11                     ; len1
    cmp rcx, rdx
    jge .max_len0
    mov rcx, rdx                     ; max_len = len1
.max_len0:
    ; rcx = max_len
    test rcx, rcx
    jz .empty
    shl rcx, 3
    call malloc
    test rax, rax
    jz .done
    mov [rbx + CALC_RESULT_PTR], rax
    mov [rbx + CALC_RESULT_LEN], rcx
    mov r8, r13                      ; ptr0
    mov r9, r14                      ; len0
    mov r10, r15                     ; ptr1
    mov r11, [rbx + CALC_RESULT_LEN] ; max_len
    mov rdx, rax
    xor rsi, rsi                 
.loop_hypot_two:
    cmp rsi, r11
    jge .done
    ; получить a
    cmp rsi, r9
    jl .a_ok
    xorps xmm0, xmm0               
    jmp .a_done
.a_ok:
    movsd xmm0, qword [r8 + rsi*8]
.a_done:
    movsd xmm1, qword [r10 + rsi*8] 
    call hypot                       ; hypot(xmm0, xmm1) -> xmm0
    movsd qword [rdx + rsi*8], xmm0
    inc rsi
    jmp .loop_hypot_two

.single_source:
    cmp r14, 2
    jne .empty
    movsd xmm0, qword [r13]      
    movsd xmm1, qword [r13 + 8]    
    call hypot
    mov rdi, 8
    call malloc
    test rax, rax
    jz .done
    mov [rbx + CALC_RESULT_PTR], rax
    mov qword [rbx + CALC_RESULT_LEN], 1
    movsd qword [rax], xmm0
    jmp .done

.empty:
    mov qword [rbx + CALC_RESULT_PTR], 0
    mov qword [rbx + CALC_RESULT_LEN], 0
    jmp .done

.done:
    mov byte [rbx + CALC_DIRTY], 0
.already_computed:
    pop r15
    pop r14
    pop r13
    pop r12
    pop rbx
    pop rbp
    ret

hypot:
    mulsd xmm0, xmm0
    mulsd xmm1, xmm1
    addsd xmm0, xmm1
    sqrtsd xmm0, xmm0
    ret

calc_read_output:
    cmp byte [rdi + CALC_DIRTY], 0
    je .cached
    call calc_compute
.cached:
    mov rax, [rdi + CALC_RESULT_PTR]
    mov rcx, [rdi + CALC_RESULT_LEN]
    ret

.data
.const_3:
    dq 3.0
.const_sqrt12:
    dq 3.4641016151377544
